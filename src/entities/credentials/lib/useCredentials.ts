import { create } from "zustand";
import {
  credentialsStatus,
  credentialsSetup,
  credentialsUnlock,
  credentialsLock,
  credentialsListAll,
  credentialsAdd,
  credentialsUpdate,
  credentialsDelete,
  credentialsProviders,
  credentialsAutofill,
  keepAliveStart,
  keepAliveStop,
  type Credential,
  type ProviderTemplate,
  type CredentialStatus,
} from "../model/api";
import { toast } from "../../../shared/model/toast";
import { t } from "../../../shared/i18n";

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
    try {
      const [st, provs] = await Promise.all([
        credentialsStatus(),
        credentialsProviders().catch(() => []),
      ]);
      set({ status: st, providers: provs });
      if (st.unlocked) {
        await get().loadAll();
      }
    } catch (e) {
      console.error("Failed to init credentials store:", e);
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
