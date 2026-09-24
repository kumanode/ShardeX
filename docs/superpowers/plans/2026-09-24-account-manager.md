# Account Manager (Unified Encrypted Vault) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive, secure, and aesthetic Account Manager in ShardeX with an encrypted vault, centralized table, bulk account importer, and direct browser profile row autofill integration.

**Architecture:** Encrypted local SQLite vault (`src-tauri/src/credentials.rs`) using AES-256-GCM + PBKDF2 in Rust, surfaced via Tauri IPC to a Zustand store (`useCredentials.ts`), rendered in a dedicated `CredentialsPage` adhering to the ShardeX design system (Geist typography, `rounded-[18px]`, `rounded-[24px]` cards, `shadow-[var(--shadow-subtle)]`), and connected to browser profile rows for 1-click login autofill via Chrome DevTools Protocol.

**Tech Stack:** Rust (Tauri v2, rusqlite, aes-gcm, pbkdf2), React, TypeScript, TailwindCSS, Zustand, Lucide/Heroicons SVG paths, Vite.

## Global Constraints
- Strict adherence to ShardeX design system in `DESIGN.md`: `#f5f5f5` canvas, `#ffffff` paper, `rounded-[18px]` inputs and buttons, `rounded-[24px]` cards, subtle hairline borders (`#e5e5e5`), font-mono metadata pills.
- Zero plaintext password leaks: passwords are encrypted on write, never returned over IPC, and only typed into Chromium via CDP input emulation.
- Zero regressions in existing profiles, proxy tables, sync bus, and build passes.

---

### Task 1: Backend Rust Extensions & Provider Enhancements

**Files:**
- Modify: `src-tauri/src/credentials.rs:310-375`
- Modify: `src-tauri/src/lib.rs:2760-2935`

**Interfaces:**
- Produces: `pub fn list_all() -> Result<Vec<Credential>>` in `src-tauri/src/credentials.rs`
- Produces: `credentials_list_all` command in `src-tauri/src/lib.rs`
- Enhances: `providers()` list with Telegram, GitHub, and Generic templates

- [ ] **Step 1: Add `list_all()` and extended providers to `credentials.rs`**
  Implement `pub fn list_all()` to query all credentials ordered by `created_at DESC` (without decrypting passwords).
  Add `telegram`, `github`, and `generic` provider templates in `pub fn providers()`.

- [ ] **Step 2: Add Rust unit test for `list_all` in `credentials.rs`**
  Verify that adding multiple credentials across different profiles is correctly listed by `list_all()`.

- [ ] **Step 3: Register `credentials_list_all` command in `lib.rs`**
  Add `#[tauri::command] fn credentials_list_all() -> Result<Vec<credentials::Credential>, String>` and register it in `tauri::generate_handler![...]`.

- [ ] **Step 4: Run Rust unit tests to verify backend compilation**
  Run: `cargo test credentials --manifest-path src-tauri/Cargo.toml`
  Ensure all tests pass.

- [ ] **Step 5: Commit Task 1**
  `git commit -m "feat(credentials): add list_all query and extend providers in backend"`

---

### Task 2: Frontend API, Navigation & Icons Integration

**Files:**
- Modify: `src/entities/credentials/model/api.ts`
- Modify: `src/shared/types/index.ts`
- Modify: `src/shared/icons/index.tsx`
- Modify: `src/widgets/Sidebar/Sidebar.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/shared/i18n/locales/en.json` & `zh.json` (ensure all keys present)

**Interfaces:**
- Produces: `credentialsListAll(): Promise<Credential[]>` in `api.ts`
- Produces: `"credentials"` section in `Section` type
- Produces: `NavCredentialsIcon` in `shared/icons`

- [ ] **Step 1: Expose `credentialsListAll` in `src/entities/credentials/model/api.ts`**
  Export `export const credentialsListAll = () => invoke<Credential[]>("credentials_list_all");`.

- [ ] **Step 2: Add `"credentials"` to `Section` in `src/shared/types/index.ts`**
  Add `"credentials"` to the `Section` union type.

- [ ] **Step 3: Add `NavCredentialsIcon` to `src/shared/icons/index.tsx`**
  Add an SVG icon component matching the geometric line style of other navigation icons.

- [ ] **Step 4: Register "Accounts" in `src/widgets/Sidebar/Sidebar.tsx`**
  Add `{ id: "credentials", label: t("sidebar.navCredentials"), svg: <NavCredentialsIcon className="size-5" /> }` inside `groupWorkspace`.

- [ ] **Step 5: Commit Task 2**
  `git commit -m "feat(navigation): integrate accounts section in types, icons, and sidebar"`

---

### Task 3: Credentials Zustand Store & Vault Gate Modal

**Files:**
- Create: `src/entities/credentials/lib/useCredentials.ts`
- Create: `src/widgets/Credentials/VaultGateModal.tsx`

**Interfaces:**
- Produces: `useCredentials` store with methods:
  - `checkStatus()`, `setup(masterPassword)`, `unlock(masterPassword)`, `lock()`, `loadAll()`, `add(cred)`, `update(cred)`, `remove(id)`, `autofill(profileId, credentialId)`
- Produces: `<VaultGateModal />` component to handle Setup & Unlock states

- [ ] **Step 1: Implement `src/entities/credentials/lib/useCredentials.ts`**
  Handle loading states, active filters (`searchQuery`, `filterProfile`, `filterProvider`), error toasts, and cache synchronization with backend.

- [ ] **Step 2: Implement `src/widgets/Credentials/VaultGateModal.tsx`**
  Create an aesthetic card following `DESIGN.md` (`rounded-[24px]`, Geist typography, `#ffffff` surface, clean input fields, clear error handling) that renders:
  - Mode 1: Create Master Password (with confirmation and security warning).
  - Mode 2: Unlock Vault (with master password input and unlock button).

- [ ] **Step 3: Commit Task 3**
  `git commit -m "feat(credentials): implement useCredentials store and VaultGateModal"`

---

### Task 4: Account Manager Page, Metrics, Table & Modals

**Files:**
- Create: `src/widgets/Credentials/CredentialsMetrics.tsx`
- Create: `src/widgets/Credentials/CredentialModal.tsx`
- Create: `src/widgets/Credentials/BulkImportModal.tsx`
- Create: `src/widgets/Credentials/CredentialsTable.tsx`
- Create: `src/pages/credentials/index.tsx`
- Modify: `src/app/App.tsx` (import and render `CredentialsPage`)

**Interfaces:**
- Produces: `CredentialsPage` component rendered when `section === "credentials"`
- Produces: `BulkImportModal` supporting `email:password` and `email:password:notes`

- [ ] **Step 1: Implement `CredentialsMetrics.tsx`**
  Display 4 metric cards:
  1. Total Accounts
  2. Linked Profiles
  3. Active Providers
  4. Active Keep-Alive sessions

- [ ] **Step 2: Implement `CredentialModal.tsx`**
  Modal for adding or editing an account:
  - Select Profile (with profile search / options from `useProfile`)
  - Select Provider (Google, X, Discord, Telegram, GitHub, Generic)
  - Input Email / Username
  - Input Password (masked, with hint "(leave empty to keep)" on edit)
  - Input Notes
  - Keep-alive select (Off, 15m, 30m, 60m)

- [ ] **Step 3: Implement `BulkImportModal.tsx`**
  Multi-line input modal with:
  - Profile Allocation: "Assign to Selected Profile" or "Distribute Evenly (Round-Robin)"
  - Default Provider select
  - Line parser supporting `email:password` or `email:password:notes`
  - Real-time preview count of valid parsed accounts
  - Batch import action with toast progress and error summary

- [ ] **Step 4: Implement `CredentialsTable.tsx`**
  Filterable table with:
  - Search input
  - Provider & Profile filters
  - Provider icon + badge
  - Email / Username
  - Linked Profile name badge
  - Notes display
  - Keep-alive switch
  - Last used timestamp
  - Quick Autofill button (shows active state if target profile is running)
  - Edit & Delete buttons

- [ ] **Step 5: Assemble `src/pages/credentials/index.tsx` & connect in `App.tsx`**
  If locked -> render `VaultGateModal`.
  If unlocked -> render Topbar, Metrics, Action Toolbar (`+ Add Account`, `Bulk Import`, `Lock Vault`), Table, and Modals.

- [ ] **Step 6: Commit Task 4**
  `git commit -m "feat(credentials): build complete Account Manager page and modals"`

---

### Task 5: Browsers Table Row & Action Integration

**Files:**
- Modify: `src/widgets/ProfileTable/ProfileRow.tsx`
- Modify: `src/features/manage-profiles/ui/ProfileRowActions.tsx`

**Interfaces:**
- Shows account count badge on profile rows
- Quick "Autofill Login" option in context menu/row actions when profile is running

- [ ] **Step 1: Add account count badge in `ProfileRow.tsx`**
  Show small subtle pill with account icon (e.g. `2 accounts`) linking or filtering accounts.

- [ ] **Step 2: Add quick Autofill action in `ProfileRowActions.tsx`**
  When a profile is running and has saved credentials in vault, offer a 1-click "Autofill" item that calls `credentials_autofill` directly.

- [ ] **Step 3: Commit Task 5**
  `git commit -m "feat(profiles): integrate account badge and quick autofill in browsers table"`

---

### Task 6: Verification, Typecheck, Build & Polish

**Files:**
- Verification only

- [ ] **Step 1: Run TypeScript compiler check**
  Run: `npx tsc --noEmit`
  Verify 0 TypeScript errors.

- [ ] **Step 2: Run i18n validator**
  Run: `node scripts/check-i18n.mjs`
  Ensure no missing translation keys.

- [ ] **Step 3: Run Rust backend test suite**
  Run: `cargo test --manifest-path src-tauri/Cargo.toml`
  Ensure all tests compile and pass.

- [ ] **Step 4: Run Vite build**
  Run: `npm run build`
  Verify production bundle builds cleanly.

- [ ] **Step 5: Commit Task 6 & final summary**
  `git commit -m "chore(release): complete account manager implementation with tests passing"`
