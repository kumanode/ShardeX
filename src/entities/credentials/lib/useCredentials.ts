import { create } from "zustand";
import {
  credentialsStatus,
  credentialsSetup,
  credentialsUnlock,
  credentialsLock,
  credentialsChangeMaster,
  credentialsReset,
  credentialsListAll,
  credentialsAdd,
  credentialsUpdate,
  credentialsDelete,
  credentialsProviders,
  credentialsAutofill,
  keepAliveStart,
  keepAliveStop,
  PROVIDER_FALLBACK,
  type Credential,
  type ProviderTemplate,
  type CredentialStatus,
} from "../model/api";
import { toast } from "../../../shared/model/toast";
import { t } from "../../../shared/i18n";

/// Result of an action that can fail for a reason the caller must show. `error`
/// is the message the backend gave (already stripped of the `Error:` prefix), so
/// the dialog can print the real cause instead of a generic sentence. A bare
/// boolean forced every caller to invent one and lose the distinction.
export type ActionResult = { ok: true } | { ok: false; error: string | null };

/// Turns an unknown throw into the text the UI shows. Tauri rejects with the
/// Rust `Err(String)` verbatim, but other failures (IPC down, a bug) arrive as
/// an Error; both have to render as something a person can act on.
function reason(e: unknown, fallbackKey: string): string {
  const raw = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  const msg = raw.trim();
  // A bare "Error: " prefix adds nothing and reads like a stack trace.
  const cleaned = msg.replace(/^Error:\s*/, "");
  return cleaned || t(fallbackKey);
}

export type CredentialsStore = {
  status: CredentialStatus | null;
  credentials: Credential[];
  providers: ProviderTemplate[];
  loading: boolean;
  searchQuery: string;
  filterProfile: string | null;
  filterProvider: string | null;

  // Actions
  init: () => Promise<void>;
  checkStatus: () => Promise<CredentialStatus>;
  setup: (masterPassword: string) => Promise<boolean>;
  unlock: (masterPassword: string) => Promise<boolean>;
  lock: () => Promise<void>;
  changeMaster: (oldPassword: string, newPassword: string) => Promise<ActionResult>;
  reset: () => Promise<ActionResult>;
  loadAll: () => Promise<void>;
  add: (cred: Credential) => Promise<boolean>;
  update: (cred: Credential) => Promise<boolean>;
  remove: (id: string, email: string) => Promise<boolean>;
  autofill: (profileId: string, credentialId: string) => Promise<boolean>;
  toggleKeepAlive: (profileId: string, provider: string, minutes: number) => Promise<void>;
  setSearchQuery: (q: string) => void;
  setFilterProfile: (p: string | null) => void;
  setFilterProvider: (p: string | null) => void;
};

export const useCredentials = create<CredentialsStore>((set, get) => ({
  status: null,
  credentials: [],
  providers: [],
  loading: false,
  searchQuery: "",
  filterProfile: null,
  filterProvider: null,

  init: async () => {
    // Re-entrant calls (StrictMode's double effect, or a second visit to the
    // tab) must not leave `status` at null: the page treats null as "still
    // loading" and would spin forever.
    //
    // Status is answered locally (a file check + an in-memory flag), so its
    // failure means the IPC bridge itself is down. Only the provider catalogue
    // justifies a whole-panel error — let the page open and let each action
    // report its own failure, the way FirstRunGate does on a dead bridge.
    try {
      const [st, provs] = await Promise.all([
        credentialsStatus(),
        credentialsProviders(),
      ]);
      set({ status: st, providers: provs });
      if (st.unlocked) {
        await get().loadAll();
      }
    } catch (e) {
      console.error("Failed to init credentials store:", e);
      set((s) => ({
        providers: s.providers.length ? s.providers : PROVIDER_FALLBACK,
        status: s.status ?? { configured: true, unlocked: false },
      }));
    }
  },

  checkStatus: async () => {
    const st = await credentialsStatus();
    set({ status: st });
    return st;
  },

  setup: async (masterPassword: string) => {
    if (masterPassword.length < 8) {
      toast.err(t("credentials.errMinLength"));
      return false;
    }
    set({ loading: true });
    try {
      await credentialsSetup(masterPassword);
      toast.ok(t("credentials.okCreated"));
      const st = await credentialsStatus();
      set({ status: st, loading: false });
      await get().loadAll();
      return true;
    } catch (e) {
      set({ loading: false });
      toast.err(String(e));
      return false;
    }
  },

  unlock: async (masterPassword: string) => {
    set({ loading: true });
    try {
      const ok = await credentialsUnlock(masterPassword);
      if (!ok) {
        toast.err(t("credentials.errWrong"));
        set({ loading: false });
        return false;
      }
      toast.ok(t("credentials.okUnlocked"));
      const st = await credentialsStatus();
      set({ status: st, loading: false });
      await get().loadAll();
      return true;
    } catch (e) {
      set({ loading: false });
      toast.err(String(e));
      return false;
    }
  },

  lock: async () => {
    try {
      await credentialsLock();
      toast.info(t("credentials.infoLocked"));
      const st = await credentialsStatus();
      set({ status: st, credentials: [] });
    } catch (e) {
      toast.err(String(e));
    }
  },

  changeMaster: async (oldPassword: string, newPassword: string) => {
    if (newPassword.length < 8) {
      const error = t("credentials.errMinLength");
      toast.err(error);
      return { ok: false, error };
    }
    // The backend refuses this too, but with an English message. Answering here
    // keeps the dialog's own language, and the backend stays the last word.
    if (newPassword === oldPassword) {
      const error = t("credentials.errSamePassword");
      toast.err(error);
      return { ok: false, error };
    }
    set({ loading: true });
    try {
      await credentialsChangeMaster(oldPassword, newPassword);
      toast.ok(t("credentials.okMasterChanged"));
      set({ loading: false });
      return { ok: true };
    } catch (e) {
      set({ loading: false });
      // The backend distinguishes a wrong old password from a write failure;
      // returning its own message keeps that distinction at the call site.
      const error = reason(e, "credentials.errChangeFailed");
      toast.err(error);
      return { ok: false, error };
    }
  },

  reset: async () => {
    set({ loading: true });
    try {
      await credentialsReset();
      toast.ok(t("credentials.okReset"));
      const st = await credentialsStatus();
      // Providers are a static catalogue, not vault contents — keep them.
      set({ status: st, credentials: [], loading: false });
      return { ok: true };
    } catch (e) {
      set({ loading: false });
      const error = reason(e, "credentials.errResetFailed");
      toast.err(error);
      return { ok: false, error };
    }
  },

  loadAll: async () => {
    set({ loading: true });
    try {
      const creds = await credentialsListAll();
      set({ credentials: creds, loading: false });
    } catch (e) {
      set({ loading: false });
      console.error("Failed to load credentials:", e);
    }
  },

  add: async (cred: Credential) => {
    if (!cred.email?.trim()) {
      toast.err(t("credentials.errEmail"));
      return false;
    }
    if (!cred.password?.trim()) {
      toast.err(t("credentials.errPassword"));
      return false;
    }
    try {
      await credentialsAdd(cred);
      toast.ok(t("credentials.okSaved"));
      // A stored interval without a live task does nothing: keep-alive is an
      // in-memory timer backend-side, so setting the column is not enough.
      if ((cred.keep_alive_minutes ?? 0) > 0) {
        await keepAliveStart(cred.profile_id, cred.provider, cred.keep_alive_minutes);
      }
      await get().loadAll();
      return true;
    } catch (e) {
      toast.err(String(e));
      return false;
    }
  },

  update: async (cred: Credential) => {
    if (!cred.email?.trim()) {
      toast.err(t("credentials.errEmail"));
      return false;
    }
    try {
      await credentialsUpdate(cred);
      toast.ok(t("credentials.okSaved"));
      // The interval may have changed, or the provider (which picks the URL the
      // task visits). Re-apply it rather than leaving the old timer running.
      if ((cred.keep_alive_minutes ?? 0) > 0) {
        await keepAliveStart(cred.profile_id, cred.provider, cred.keep_alive_minutes);
      } else {
        await keepAliveStop(cred.profile_id);
      }
      await get().loadAll();
      return true;
    } catch (e) {
      toast.err(String(e));
      return false;
    }
  },

  remove: async (id: string, _email?: string) => {
    try {
      await credentialsDelete(id);
      toast.ok(t("credentials.okDeleted"));
      await get().loadAll();
      return true;
    } catch (e) {
      toast.err(String(e));
      return false;
    }
  },

  autofill: async (profileId: string, credentialId: string) => {
    try {
      await credentialsAutofill(profileId, credentialId);
      toast.ok(t("credentials.okAutofilled"));
      await get().loadAll();
      return true;
    } catch (e) {
      toast.err(String(e));
      return false;
    }
  },

  toggleKeepAlive: async (profileId: string, provider: string, minutes: number) => {
    try {
      if (minutes > 0) {
        await keepAliveStart(profileId, provider, minutes);
      } else {
        await keepAliveStop(profileId);
      }
      await get().loadAll();
    } catch (e) {
      toast.err(String(e));
    }
  },

  setSearchQuery: (q: string) => set({ searchQuery: q }),
  setFilterProfile: (p: string | null) => set({ filterProfile: p }),
  setFilterProvider: (p: string | null) => set({ filterProvider: p }),
}));
