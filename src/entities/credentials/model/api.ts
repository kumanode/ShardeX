import { invoke } from "@tauri-apps/api/core";

export type Credential = {
  id: string;
  profile_id: string;
  provider: string;
  email: string;
  /// Write-only: sent to add/update, never returned by the backend.
  password?: string;
  notes?: string | null;
  created_at: number;
  last_used: number;
  keep_alive_minutes: number;
};

export type ProviderTemplate = {
  id: string;
  name: string;
  domains: string[];
  keep_alive_url: string;
};

export type CredentialStatus = { configured: boolean; unlocked: boolean };

export const credentialsStatus = () => invoke<CredentialStatus>("credentials_status");
export const credentialsSetup = (masterPassword: string) =>
  invoke<void>("credentials_setup", { masterPassword });
export const credentialsUnlock = (masterPassword: string) =>
  invoke<boolean>("credentials_unlock", { masterPassword });
export const credentialsLock = () => invoke<void>("credentials_lock");
export const credentialsList = (profileId: string) =>
  invoke<Credential[]>("credentials_list", { profileId });
export const credentialsAdd = (cred: Credential) => invoke<void>("credentials_add", { cred });
export const credentialsUpdate = (cred: Credential) =>
  invoke<void>("credentials_update", { cred });
export const credentialsDelete = (id: string) => invoke<void>("credentials_delete", { id });
export const credentialsProviders = () => invoke<ProviderTemplate[]>("credentials_providers");
export const credentialsAutofill = (profileId: string, credentialId: string) =>
  invoke<void>("credentials_autofill", { profileId, credentialId });

export const keepAliveStart = (profileId: string, provider: string, minutes: number) =>
  invoke<void>("keep_alive_start", { profileId, provider, minutes });
export const keepAliveStop = (profileId: string) => invoke<void>("keep_alive_stop", { profileId });
export const keepAliveStatus = (profileId: string) =>
  invoke<boolean>("keep_alive_status", { profileId });
