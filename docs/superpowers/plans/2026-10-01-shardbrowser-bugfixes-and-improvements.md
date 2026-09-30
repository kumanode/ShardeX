# ShardBrowser Bugfixes and Feature Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix confirmed logic bugs and implement high-priority feature improvements in ShardBrowser across Account Credentials/Bulk Import, Keep-Alive Persistence, Sync Panel Wallet Management, and Profile Generation.

**Architecture:**
- Frontend: Enhance `BulkImportModal.tsx` with resilient parsing (colon in password, optional 2FA), live visual preview table, skipped lines feedback, profile auto-sync, and domain-based provider detection. Fix `CredentialModal.tsx` form state wiping and `VaultGateModal.tsx` error messaging.
- Backend (Tauri / Rust): Add `credentials_set_keep_alive` command in `credentials.rs` / `lib.rs` that persists interval changes to SQLite `credentials.db`. Fix `sync_unlock_wallets` with resilient retry polling. Update `SyncPanel.tsx` to search for `"wallet"` across multi-wallet engines. Fix `BulkGeneratorModal.tsx` timestamp format to ISO-8601.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Zustand v5, Rust, Tauri v2, SQLite (rusqlite), CDP.

## Global Constraints
- Do not introduce untranslated raw text in TSX components: all human strings must go through `useT()` / `t()` and be registered in both `en.json` and `zh.json`.
- Run `npm run check:i18n` and `npx tsc --noEmit` before completion.
- Rust changes must pass `cargo check` in `src-tauri`.

---

### Task 1: Fix Bulk Import Modal (`BulkImportModal.tsx`) & Resilient Parsing

**Files:**
- Modify: `src/widgets/Credentials/BulkImportModal.tsx`
- Modify: `src/shared/i18n/locales/en.json`
- Modify: `src/shared/i18n/locales/zh.json`

**Problems Addressed:**
1. `selectedProfileId` defaulting to `""` when profiles load asynchronously, resulting in orphaned credentials with `profile_id: ""`.
2. Password truncated if it contains a colon (`:`).
3. Missing visual feedback: user cannot see how pasted rows are parsed (email vs password vs provider).
4. Missing feedback for invalid/skipped rows.
5. Inability to auto-detect provider by email domain (forcing gmail on all lines).
6. 8-char UUID slice collision risk in batch imports.

- [ ] **Step 1: Update i18n dictionaries for new Bulk Import UI strings**
- [ ] **Step 2: Implement robust parsing helper with delimiter & format handling**
- [ ] **Step 3: Add `useEffect` to sync `selectedProfileId` when `profiles` loads**
- [ ] **Step 4: Add live preview table and skipped rows reporting in `BulkImportModal.tsx`**
- [ ] **Step 5: Run `npm run check:i18n` and verify typecheck**

---

### Task 2: Fix Keep-Alive Persistence & Reversion (`credentials.rs`, `lib.rs`, `useCredentials.ts`)

**Files:**
- Modify: `src-tauri/src/credentials.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src/entities/credentials/model/api.ts`
- Modify: `src/entities/credentials/lib/useCredentials.ts`

**Problems Addressed:**
1. Clicking keep-alive in `CredentialsTable.tsx` calls `toggleKeepAlive`, which triggers in-memory task but never updates `credentials.db`.
2. Calling `loadAll()` reloads the database row, which reverts the UI button immediately.
3. Keep-alive settings do not persist across app restarts.

- [ ] **Step 1: Add `set_keep_alive(profile_id, provider, minutes)` in `src-tauri/src/credentials.rs`**
- [ ] **Step 2: Expose `credentials_set_keep_alive` command in `src-tauri/src/lib.rs`**
- [ ] **Step 3: Update `src/entities/credentials/model/api.ts` and `useCredentials.ts`**
- [ ] **Step 4: Verify `cargo check` and UI compilation**

---

### Task 3: Fix Credential Modal Form Reset & Vault Gate Setup Error

**Files:**
- Modify: `src/widgets/Credentials/CredentialModal.tsx`
- Modify: `src/widgets/Credentials/VaultGateModal.tsx`

**Problems Addressed:**
1. In `CredentialModal.tsx`, `useEffect` depends on `[initial, profiles]`, which wipes the user's input mid-typing when profiles store re-renders.
2. In `VaultGateModal.tsx`, setup failure displays "Wrong master password" (`credentials.errWrong`).

- [ ] **Step 1: Fix `CredentialModal.tsx` reset lifecycle**
- [ ] **Step 2: Fix `VaultGateModal.tsx` error message on setup failure**
- [ ] **Step 3: Test and verify behavior**

---

### Task 4: Fix Sync Panel Extension Wallet & Unlock Wallets

**Files:**
- Modify: `src/widgets/SyncPanel/SyncPanel.tsx`
- Modify: `src-tauri/src/lib.rs`

**Problems Addressed:**
1. In `SyncPanel.tsx`, hardcoded `"metamask"` parameter in `handleOpenWallet("metamask")` bypasses the multi-wallet detector in `lib.rs` (failing for Rabby, Phantom, OKX, Backpack, Keplr).
2. In `lib.rs` (`sync_unlock_wallets`), zero retry/wait time causes immediate failure (0 unlocked) before extension page finishes mounting.

- [ ] **Step 1: Change `handleOpenWallet("metamask")` to `"wallet"` in `SyncPanel.tsx`**
- [ ] **Step 2: Add retry polling loop (up to 8s) in `sync_unlock_wallets` in `lib.rs`**
- [ ] **Step 3: Verify with `cargo check` and `npm run check:i18n`**

---

### Task 5: Fix Profile Bulk Generator Timestamp Format

**Files:**
- Modify: `src/features/manage-profiles/ui/BulkGeneratorModal.tsx`

**Problems Addressed:**
1. `BulkGeneratorModal.tsx` writes `created_at: \`@${Math.floor(Date.now() / 1000)}\``, which sorts differently than regular ISO-8601 timestamps (`2026-10-01T...`).

- [ ] **Step 1: Update `BulkGeneratorModal.tsx` to use ISO-8601 string (`new Date().toISOString()`)**
- [ ] **Step 2: Run verification**

---

### Task 6: Final Verification & Health Check

- [ ] **Step 1: Run `npm run check:i18n`**
- [ ] **Step 2: Run `npx tsc --noEmit`**
- [ ] **Step 3: Run `cargo check` in `src-tauri`**
- [ ] **Step 4: Report completed fixes to user**
