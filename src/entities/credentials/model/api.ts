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

/// The operator has to type this to arm a vault wipe. A checkbox is too easy to
/// click through for something that destroys every saved account. Shared by the
/// locked gate's "forgot password" path and the unlocked security panel so the
/// two prompts cannot drift apart.
export const VAULT_RESET_PHRASE = "DELETE";

/// Shown when the provider catalogue could not be read from the backend. The
/// list is a static built-in table, so a cold IPC bridge is no reason to leave
/// the provider pickers empty.
export const PROVIDER_FALLBACK: ProviderTemplate[] = [
  { id: "gmail", name: "Google / Gmail", domains: ["accounts.google.com", "mail.google.com"], keep_alive_url: "" },
  { id: "x", name: "X / Twitter", domains: ["x.com", "twitter.com"], keep_alive_url: "" },
  { id: "discord", name: "Discord", domains: ["discord.com"], keep_alive_url: "" },
  { id: "telegram", name: "Telegram", domains: ["web.telegram.org"], keep_alive_url: "" },
  { id: "github", name: "GitHub", domains: ["github.com"], keep_alive_url: "" },
  { id: "generic", name: "Custom / Generic", domains: [], keep_alive_url: "" },
];

export const credentialsStatus = () => invoke<CredentialStatus>("credentials_status");
export const credentialsSetup = (masterPassword: string) =>
  invoke<void>("credentials_setup", { masterPassword });
export const credentialsUnlock = (masterPassword: string) =>
  invoke<boolean>("credentials_unlock", { masterPassword });
export const credentialsLock = () => invoke<void>("credentials_lock");
export const credentialsChangeMaster = (oldPassword: string, newPassword: string) =>
  invoke<void>("credentials_change_master", { oldPassword, newPassword });
export const credentialsReset = () => invoke<void>("credentials_reset");
export const credentialsList = (profileId: string) =>
  invoke<Credential[]>("credentials_list", { profileId });
export const credentialsListAll = () => invoke<Credential[]>("credentials_list_all");
export const credentialsAdd = (cred: Credential) => invoke<void>("credentials_add", { cred });
export const credentialsAddBatch = (creds: Credential[]) =>
  invoke<number>("credentials_add_batch", { creds });
export const credentialsUpdate = (cred: Credential) =>
  invoke<void>("credentials_update", { cred });
export const credentialsDelete = (id: string) => invoke<void>("credentials_delete", { id });
export const credentialsProviders = () => invoke<ProviderTemplate[]>("credentials_providers");
export const credentialsDetectProvider = (url: string) =>
  invoke<string | null>("credentials_detect_provider", { url });
export const credentialsAutofill = (profileId: string, credentialId: string) =>
  invoke<void>("credentials_autofill", { profileId, credentialId });

export const keepAliveStart = (profileId: string, provider: string, minutes: number) =>
  invoke<void>("keep_alive_start", { profileId, provider, minutes });
export const keepAliveStop = (profileId: string) => invoke<void>("keep_alive_stop", { profileId });
export const keepAliveStatus = (profileId: string) =>
  invoke<boolean>("keep_alive_status", { profileId });
