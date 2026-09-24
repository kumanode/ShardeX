# Launch Synced Airdrop Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform ShardeX's "Launch Synced" feature into an airdrop-grade multi-browser synchronizer that automatically mirrors extension wallet popups (MetaMask/Rabby/Phantom), address bar typing/searches, tab lifecycles (close/switch/new tab), and provides 1-click wallet opening and master password unlocking.

**Architecture:** 
1. Upgrade the Rust CDP layer (`cdp.rs` & `lib.rs`) to track all targets (pages, popups, extensions) using `Target.setAutoAttach` and `Target.setDiscoverTargets`.
2. Expand `start_group_nav_watcher` to sync tab closes (`Target.targetDestroyed`), tab switches (`Target.activateTarget`), and full URL schemes (`chrome-extension://`, `chrome://`, search engine queries, SPA hash navigation).
3. Route extension popup input to corresponding follower popup targets, with popup window tiling.
4. Add backend commands and floating `SyncPanel` controls for "Open Wallet in All", "Unlock All Wallets", and "Tile Popups".

**Tech Stack:** Rust (Tauri 2, tokio, serde_json, cdp-client), React, TypeScript, TailwindCSS.

## Global Constraints

- Never hardcode extension IDs; resolve dynamically or match on URL patterns (`chrome-extension://*`).
- Retain backwards compatibility for non-synced browser profiles and existing `sync_launch` options.
- Protect against race conditions and missing popup targets with anti-desync guards and timeouts.
- All new user-facing strings must have entries in `en.json` and `zh.json`.
- Follow conventional commits (`feat:`, `fix:`, `docs:`, etc.).

---

### Task 1: CDP Multi-Target Tracking & Tab Lifecycle Synchronization

**Files:**
- Modify: `src-tauri/src/cdp.rs:210-330`
- Modify: `src-tauri/src/cdp.rs:440-500`
- Modify: `src-tauri/src/lib.rs:1610-1705`
- Test: `src-tauri/src/cdp.rs` (add unit test module)

**Interfaces:**
- Consumes: `cdp::ensure_attached`, `cdp::subscribe_events`, `cdp::get`
- Produces:
  - `cdp::list_page_targets(profile_id: &str) -> Result<Vec<Value>>`
  - `cdp::activate_target(profile_id: &str, target_id: &str) -> Result<()>`
  - `cdp::close_target(profile_id: &str, target_id: &str) -> Result<()>`
  - `cdp::get_active_tab_index(profile_id: &str) -> Result<usize>`
  - `cdp::activate_tab_by_index(profile_id: &str, index: usize) -> Result<()>`
  - `cdp::close_tab_by_index(profile_id: &str, index: usize) -> Result<()>`

- [ ] **Step 1: Write unit tests for target indexing and activation helpers**

In `src-tauri/src/cdp.rs`:
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_target_filter_page_and_extension() {
        let targets = vec![
            json!({ "targetId": "1", "type": "page", "url": "https://uniswap.org" }),
            json!({ "targetId": "2", "type": "page", "url": "chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/notification.html" }),
            json!({ "targetId": "3", "type": "service_worker", "url": "chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/background.js" }),
        ];
        let pages: Vec<&Value> = targets.iter().filter(|t| {
            let ty = t.get("type").and_then(|v| v.as_str()).unwrap_or("");
            ty == "page" || ty == "other"
        }).collect();
        assert_eq!(pages.len(), 2);
    }
}
```

- [ ] **Step 2: Run test to verify compilation**

Run: `cargo test --manifest-path src-tauri/Cargo.toml test_target_filter_page_and_extension`
Expected: PASS

- [ ] **Step 3: Implement target management functions in `cdp.rs`**

Add functions in `src-tauri/src/cdp.rs`:
```rust
/// Lists all interactive targets (page, popup, extension popup).
pub async fn list_page_targets(profile_id: &str) -> Result<Vec<Value>> {
    ensure_attached(profile_id).await?;
    let s = get(profile_id).ok_or_else(|| anyhow!("not attached"))?;
    let res = s.call("Target.getTargets", json!({}), None).await?;
    let targets = res.get("targetInfos")
        .and_then(|t| t.as_array())
        .cloned()
        .unwrap_or_default();
    Ok(targets.into_iter().filter(|t| {
        let ty = t.get("type").and_then(|v| v.as_str()).unwrap_or("");
        ty == "page" || ty == "other"
    }).collect())
}

/// Activates a specific target by its targetId.
pub async fn activate_target(profile_id: &str, target_id: &str) -> Result<()> {
    ensure_attached(profile_id).await?;
    let s = get(profile_id).ok_or_else(|| anyhow!("not attached"))?;
    s.call("Target.activateTarget", json!({ "targetId": target_id }), None).await?;
    Ok(())
}

/// Closes a target by targetId.
pub async fn close_target(profile_id: &str, target_id: &str) -> Result<()> {
    ensure_attached(profile_id).await?;
    let s = get(profile_id).ok_or_else(|| anyhow!("not attached"))?;
    s.call("Target.closeTarget", json!({ "targetId": target_id }), None).await?;
    Ok(())
}

/// Closes tab at a given index on the profile.
pub async fn close_tab_by_index(profile_id: &str, index: usize) -> Result<()> {
    let targets = list_page_targets(profile_id).await?;
    if let Some(target) = targets.get(index) {
        if let Some(tid) = target.get("targetId").and_then(|v| v.as_str()) {
            return close_target(profile_id, tid).await;
        }
    }
    Ok(())
}

/// Activates tab at a given index on the profile.
pub async fn activate_tab_by_index(profile_id: &str, index: usize) -> Result<()> {
    let targets = list_page_targets(profile_id).await?;
    if let Some(target) = targets.get(index) {
        if let Some(tid) = target.get("targetId").and_then(|v| v.as_str()) {
            return activate_target(profile_id, tid).await;
        }
    }
    Ok(())
}
```

- [ ] **Step 4: Update `start_group_nav_watcher` in `src-tauri/src/lib.rs` for Tab Sync**

Listen to `Target.targetDestroyed`, `Target.targetCreated`, and `Target.targetInfoChanged`:
- When Master destroys a tab, determine its index among Master targets and close the same index on followers.
- When Master switches active tab (indicated by `targetInfoChanged`), activate the corresponding tab on followers.

- [ ] **Step 5: Run cargo check to verify compilation**

Run: `cargo check --manifest-path src-tauri/Cargo.toml`
Expected: Success with 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/cdp.rs src-tauri/src/lib.rs
git commit -m "feat(sync): add multi-target CDP tracking and tab lifecycle synchronization"
```

---

### Task 2: Omnibox & Full URL Scheme Navigation Sync

**Files:**
- Modify: `src-tauri/src/lib.rs:1650-1700`
- Modify: `src-tauri/src/lib.rs:1776-1808`

**Interfaces:**
- Consumes: `cdp::navigate_page`, `sync_bus::Bus::broadcast`
- Produces:
  - Enhanced `sync_navigate(group: String, input: String)`: supports `chrome-extension://`, `chrome://`, SPA hashes, and search queries (fallback to `https://www.google.com/search?q=...`).

- [ ] **Step 1: Write helper function for URL normalization with search query fallback**

In `src-tauri/src/lib.rs`:
```rust
fn normalize_navigate_input(input: &str) -> String {
    let trimmed = input.trim();
    if trimmed.starts_with("http://")
        || trimmed.starts_with("https://")
        || trimmed.starts_with("chrome-extension://")
        || trimmed.starts_with("chrome://")
        || trimmed.starts_with("about:")
    {
        trimmed.to_string()
    } else if trimmed.contains('.') && !trimmed.contains(' ') {
        format!("https://{trimmed}")
    } else {
        // Fallback to search query
        let encoded: String = url::form_urlencoded::byte_serialize(trimmed.as_bytes()).collect();
        format!("https://www.google.com/search?q={encoded}")
    }
}
```

- [ ] **Step 2: Update `Page.frameNavigated` handling in `start_group_nav_watcher`**

Remove the check `if url.starts_with("http://") || url.starts_with("https://")` and replace with:
```rust
if !url.is_empty() && url != "about:blank" {
    // Sync all schemes including chrome-extension:// and chrome://
    let mut last = last_url_clone.lock().await;
    if *last == url {
        continue;
    }
    *last = url.to_string();
    drop(last);

    let delay_ms = st.delay_ms;
    let mut follower_idx = 0usize;
    for target_id in members {
        if target_id != id_clone {
            let u = url.to_string();
            let stagger = if delay_ms > 0 {
                tokio::time::Duration::from_millis(
                    (delay_ms as u64)
                        + ((follower_idx as u64 * 35) % (delay_ms as u64 + 10)),
                )
            } else {
                tokio::time::Duration::ZERO
            };
            follower_idx += 1;
            tokio::spawn(async move {
                if !stagger.is_zero() {
                    tokio::time::sleep(stagger).await;
                }
                let _ = cdp::navigate_page(&target_id, &u).await;
            });
        }
    }
}
```

- [ ] **Step 3: Update `sync_navigate` command to use `normalize_navigate_input`**

Update `sync_navigate` in `src-tauri/src/lib.rs`:
```rust
#[tauri::command]
async fn sync_navigate(group: String, url: String) -> Result<(), String> {
    let b = bus().await?;
    let target_url = normalize_navigate_input(&url);
    b.broadcast(&group, &format!("{{\"navigate\":\"{target_url}\"}}\n"));

    let members = b.members(&group);
    let st = b.status(&group);
    let delay_ms = st.delay_ms;
    let mut follower_idx = 0usize;

    for id in members {
        let u = target_url.clone();
        let stagger = if delay_ms > 0 && follower_idx > 0 {
            tokio::time::Duration::from_millis(
                (delay_ms as u64) + ((follower_idx as u64 * 35) % (delay_ms as u64 + 10)),
            )
        } else {
            tokio::time::Duration::ZERO
        };
        follower_idx += 1;
        tokio::spawn(async move {
            if !stagger.is_zero() {
                tokio::time::sleep(stagger).await;
            }
            let _ = cdp::navigate_page(&id, &u).await;
        });
    }
    Ok(())
}
```

- [ ] **Step 4: Verify compilation with cargo check**

Run: `cargo check --manifest-path src-tauri/Cargo.toml`
Expected: Success

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat(sync): support omnibox search queries, extension URLs, and SPA routes"
```

---

### Task 3: Extension Popup Detection & Input Routing

**Files:**
- Modify: `src-tauri/src/cdp.rs:750-820`
- Modify: `src-tauri/src/lib.rs:1820-1890`

**Interfaces:**
- Consumes: `cdp::list_page_targets`, `cdp::browser_call`
- Produces:
  - `cdp::list_extension_popups(profile_id: &str) -> Result<Vec<Value>>`
  - `sync_arrange_popups(group: String) -> Result<(), String>`
  - `sync_route_popup_click(group: String, x: f64, y: f64) -> Result<(), String>`

- [ ] **Step 1: Implement `list_extension_popups` in `src-tauri/src/cdp.rs`**

```rust
/// Returns all open extension popup targets for a profile.
pub async fn list_extension_popups(profile_id: &str) -> Result<Vec<Value>> {
    let targets = list_page_targets(profile_id).await?;
    Ok(targets.into_iter().filter(|t| {
        let url = t.get("url").and_then(|v| v.as_str()).unwrap_or("");
        url.starts_with("chrome-extension://") && (url.contains("notification") || url.contains("popup") || url.contains("prompt"))
    }).collect())
}
```

- [ ] **Step 2: Implement `sync_arrange_popups` command in `src-tauri/src/lib.rs`**

When called, finds open extension popups on each member and activates them, ensuring they are placed prominently beside their parent browser windows.

- [ ] **Step 3: Implement popup click routing in `src-tauri/src/lib.rs`**

When user clicks inside Master's extension popup, replicate the click coordinates via `Motion.tap` to all follower profiles' active extension popup targets.

- [ ] **Step 4: Verify compilation with cargo check**

Run: `cargo check --manifest-path src-tauri/Cargo.toml`
Expected: Success

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/cdp.rs src-tauri/src/lib.rs
git commit -m "feat(sync): add extension popup detection and input mirroring"
```

---

### Task 4: Airdrop Wallet Tools in Tauri Backend

**Files:**
- Modify: `src-tauri/src/lib.rs:1850-1920`
- Modify: `src-tauri/src/lib.rs:2600-2660` (register commands)

**Interfaces:**
- Consumes: `cdp::create_tab`, `cdp::browser_call`, `extensions::load_path`
- Produces:
  - `sync_open_extension(group: String, keyword_or_id: String) -> Result<(), String>`
  - `sync_unlock_wallets(group: String, password: String) -> Result<usize, String>`
  - `sync_wallet_status(group: String) -> Result<Value, String>`

- [ ] **Step 1: Implement `sync_open_extension` in `src-tauri/src/lib.rs`**

```rust
#[tauri::command]
async fn sync_open_extension(
    group: String,
    keyword_or_id: String,
) -> Result<(), String> {
    let b = bus().await?;
    let members = b.members(&group);
    if members.is_empty() {
        return Err("no members in group".into());
    }

    // Resolve extension URL or home page
    let url = if keyword_or_id.starts_with("chrome-extension://") {
        keyword_or_id
    } else {
        format!("chrome-extension://{keyword_or_id}/home.html")
    };

    for id in members {
        let u = url.clone();
        tokio::spawn(async move {
            let _ = cdp::create_tab(&id, Some(&u)).await;
        });
    }
    Ok(())
}
```

- [ ] **Step 2: Implement `sync_unlock_wallets` in `src-tauri/src/lib.rs`**

Inspects all open targets for a password field, fills the password, and clicks the Unlock/Submit button:
```rust
#[tauri::command]
async fn sync_unlock_wallets(group: String, password: String) -> Result<usize, String> {
    let b = bus().await?;
    let members = b.members(&group);
    let mut count = 0;

    for id in members {
        let pwd = password.clone();
        tokio::spawn(async move {
            // Find password field in active page/popup
            if let Ok(true) = fill_field_kind(&id, "password", &pwd).await {
                let _ = click_field_kind(&id, "submit").await;
                let _ = cdp::browser_call(&id, "Motion.pressKey", serde_json::json!({ "key": "Enter" })).await;
            }
        });
        count += 1;
    }
    Ok(count)
}
```

- [ ] **Step 3: Register new commands in `tauri::generate_handler!` in `src-tauri/src/lib.rs`**

Add `sync_open_extension`, `sync_unlock_wallets`, and `sync_arrange_popups`.

- [ ] **Step 4: Verify compilation with cargo check**

Run: `cargo check --manifest-path src-tauri/Cargo.toml`
Expected: Success

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat(sync): add sync_open_extension and sync_unlock_wallets backend commands"
```

---

### Task 5: Frontend API & Floating SyncPanel UI Upgrades

**Files:**
- Modify: `src/entities/profile/model/api.ts:40-50`
- Modify: `src/widgets/SyncPanel/SyncPanel.tsx`
- Modify: `src/shared/i18n/locales/en.json`
- Modify: `src/shared/i18n/locales/zh.json`

**Interfaces:**
- Consumes: Backend Tauri commands (`sync_open_extension`, `sync_unlock_wallets`, `sync_arrange_popups`)
- Produces:
  - TypeScript bindings in `api.ts`:
    - `export const syncOpenExtension = (group: string, keywordOrId: string) => invoke<void>("sync_open_extension", { group, keywordOrId });`
    - `export const syncUnlockWallets = (group: string, password: string) => invoke<number>("sync_unlock_wallets", { group, password });`
    - `export const syncArrangePopups = (group: string) => invoke<void>("sync_arrange_popups", { group });`
  - Floating UI controls in `SyncPanel.tsx` with wallet quick actions.

- [ ] **Step 1: Add new API methods in `src/entities/profile/model/api.ts`**

```typescript
export const syncOpenExtension = (group: string, keywordOrId: string) =>
  invoke<void>("sync_open_extension", { group, keywordOrId });
export const syncUnlockWallets = (group: string, password: string) =>
  invoke<number>("sync_unlock_wallets", { group, password });
export const syncArrangePopups = (group: string) =>
  invoke<void>("sync_arrange_popups", { group });
```

- [ ] **Step 2: Add translation keys in `en.json` and `zh.json`**

In `src/shared/i18n/locales/en.json`:
```json
"syncPanel": {
  "openWallet": "Open Wallet",
  "unlockWallets": "Unlock All",
  "tilePopups": "Tile Popups",
  "enterPassword": "Enter Master Password...",
  "unlockedCount": "Unlocked {count} wallets"
}
```

In `src/shared/i18n/locales/zh.json`:
```json
"syncPanel": {
  "openWallet": "打开钱包",
  "unlockWallets": "批量解锁",
  "tilePopups": "平铺弹窗",
  "enterPassword": "输入主密码...",
  "unlockedCount": "已解锁 {count} 个钱包"
}
```

- [ ] **Step 3: Add Wallet Quick-Action Bar in `src/widgets/SyncPanel/SyncPanel.tsx`**

Add an expandable or compact toolbar row in `SyncPanel.tsx` with:
- Wallet icon button: "Open Wallet" (MetaMask / Rabby / Phantom)
- Key/Lock icon button: "Unlock All" (opens mini password prompt with Enter to unlock)
- Tile Popups icon button
- Live tab count display badge

- [ ] **Step 4: Verify frontend build with npm run build**

Run: `npm run build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/entities/profile/model/api.ts src/widgets/SyncPanel/SyncPanel.tsx src/shared/i18n/locales/en.json src/shared/i18n/locales/zh.json
git commit -m "feat(ui): add airdrop wallet quick actions and popup tiling to SyncPanel"
```

---

### Task 6: End-to-End Verification & Validation

**Files:**
- Test scripts: `scripts/test-sync-airdrop.mjs` (or manual verification checklist)
- Docs: `docs/superpowers/specs/2026-09-24-launch-synced-airdrop-enhancements-design.md`

- [ ] **Step 1: Test `npm run check-i18n` to verify all translation keys are present**

Run: `node scripts/check-i18n.mjs`
Expected: All keys pass without missing entries.

- [ ] **Step 2: Verify Rust backend compilation and tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: All unit tests pass.

- [ ] **Step 3: Final Commit and status check**

```bash
git status
```
