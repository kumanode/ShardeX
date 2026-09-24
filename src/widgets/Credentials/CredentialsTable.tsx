import { useMemo, useState } from "react";
import { useCredentials, type Credential } from "../../entities/credentials";
import { useProfile } from "../../entities/profile";
import {
  KeyIcon,
  SearchIcon,
  PlayIcon,
  EditIcon,
  DeleteIcon,
  CopyIcon,
  ClockIcon,
} from "../../shared/icons";
import { clip } from "../../shared/lib/clipboard";
import { toast } from "../../shared/model/toast";
import { useT } from "../../shared/i18n";

function formatTimestamp(ts: number): string {
  if (!ts) return "—";
  const date = new Date(ts * 1000);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getProviderBadge(provider: string) {
  const p = provider.toLowerCase();
  if (p === "gmail" || p === "google") {
    return {
      name: "Google",
      color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    };
  }
  if (p === "x" || p === "twitter") {
    return {
      name: "X",
      color: "bg-zinc-500/10 text-zinc-900 dark:text-zinc-100 border-zinc-500/20",
    };
  }
  if (p === "discord") {
    return {
      name: "Discord",
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    };
  }
  if (p === "telegram") {
    return {
      name: "Telegram",
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    };
  }
  if (p === "github") {
    return {
      name: "GitHub",
      color: "bg-neutral-500/10 text-neutral-800 dark:text-neutral-200 border-neutral-500/20",
    };
  }
  return {
    name: provider,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  };
}

export function CredentialsTable({
  onEdit,
}: {
  onEdit: (cred: Credential) => void;
}) {
  const t = useT();
  const credentials = useCredentials((s) => s.credentials);
  const providers = useCredentials((s) => s.providers);
  const remove = useCredentials((s) => s.remove);
  const autofill = useCredentials((s) => s.autofill);
  const toggleKeepAlive = useCredentials((s) => s.toggleKeepAlive);
  const profiles = useProfile((s) => s.profiles);
  const running = useProfile((s) => s.running);

  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [profileFilter, setProfileFilter] = useState<string>("all");
  const [autofillingId, setAutofillingId] = useState<string | null>(null);

  // Profile lookup dictionary
  const profileMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of profiles) {
      map.set(p.id, p.name || p.id);
    }
    return map;
  }, [profiles]);

  // Filtered credentials
  const filteredCredentials = useMemo(() => {
    return credentials.filter((c) => {
      if (providerFilter !== "all" && c.provider !== providerFilter) return false;
      if (profileFilter !== "all" && c.profile_id !== profileFilter) return false;
      if (!search.trim()) return true;

      const q = search.toLowerCase();
      const profileName = (profileMap.get(c.profile_id) || "").toLowerCase();
      return (
        c.email.toLowerCase().includes(q) ||
        c.provider.toLowerCase().includes(q) ||
        (c.notes && c.notes.toLowerCase().includes(q)) ||
        profileName.includes(q)
      );
    });
  }, [credentials, providerFilter, profileFilter, search, profileMap]);

  const handleAutofill = async (cred: Credential) => {
    setAutofillingId(cred.id);
    await autofill(cred.profile_id, cred.id);
    setAutofillingId(null);
  };

  const handleDelete = async (cred: Credential) => {
    if (confirm(t("credentials.confirmDelete", { email: cred.email }))) {
      await remove(cred.id, cred.email);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--color-mid-gray,#737373)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("credentials.searchPlaceholder")}
            className="w-full rounded-[18px] border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)] pl-10 pr-4 py-2 text-[13px] text-[var(--color-ink,#0a0a0a)] placeholder:text-zinc-400 focus:border-[var(--color-ink,#0a0a0a)] focus:outline-none transition-all shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="rounded-[18px] border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-ink,#0a0a0a)] focus:outline-none shadow-xs cursor-pointer"
          >
            <option value="all">{t("credentials.allProviders")}</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Profile Filter */}
          <select
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value)}
            className="rounded-[18px] border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-ink,#0a0a0a)] focus:outline-none shadow-xs cursor-pointer"
          >
            <option value="all">{t("credentials.allProfiles")}</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.name || p.id}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-[24px] bg-[var(--color-paper,#ffffff)] border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)]">
        <div className="w-full overflow-x-auto min-w-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--color-mid-gray,#737373)]">
                <th className="py-3 px-4">{t("credentials.provider")}</th>
                <th className="py-3 px-4">{t("credentials.login")}</th>
                <th className="py-3 px-4">{t("credentials.profile")}</th>
                <th className="py-3 px-4">{t("credentials.notes")}</th>
                <th className="py-3 px-4">{t("credentials.keepAliveTitle")}</th>
                <th className="py-3 px-4">{t("credentials.colLastUsed")}</th>
                <th className="py-3 px-4 text-right">{t("credentials.colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-hairline,#e5e5e5)] text-[13px]">
              {filteredCredentials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--color-mid-gray,#737373)]">
                    <div className="flex flex-col items-center gap-2">
                      <KeyIcon className="size-6 text-zinc-300 dark:text-zinc-600" />
                      <p className="font-medium">{t("credentials.emptyTitle")}</p>
                      <span className="text-[12px]">{t("credentials.empty")}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCredentials.map((cred) => {
                  const badge = getProviderBadge(cred.provider);
                  const profileName = profileMap.get(cred.profile_id) || cred.profile_id;
                  const isRunning = !!running[cred.profile_id];
                  const isAutofilling = autofillingId === cred.id;

                  return (
                    <tr
                      key={cred.id}
                      className="hover:bg-[var(--color-surface-alt,#fafafa)] transition-colors"
                    >
                      {/* Provider Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-[12px] px-2.5 py-0.5 text-[11.5px] font-semibold border ${badge.color}`}
                        >
                          {badge.name}
                        </span>
                      </td>

                      {/* Email / Username */}
                      <td className="py-3 px-4 font-medium text-[var(--color-ink,#0a0a0a)]">
                        <div className="flex items-center gap-1.5">
                          <span>{cred.email}</span>
                          <button
                            type="button"
                            onClick={() => {
                              clip.write(cred.email);
                              toast.ok("Email copied to clipboard");
                            }}
                            className="text-[var(--color-mid-gray,#737373)] hover:text-[var(--color-ink,#0a0a0a)] cursor-pointer"
                            title={t("credentials.copyEmail")}
                          >
                            <CopyIcon className="size-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Linked Profile */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 rounded-[14px] bg-[var(--color-canvas,#f5f5f5)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-ink,#0a0a0a)] border border-[var(--color-hairline,#e5e5e5)]">
                          {isRunning && (
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" title={t("credentials.running")} />
                          )}
                          <span className="max-w-[130px] truncate">{profileName}</span>
                        </span>
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 text-[var(--color-mid-gray,#737373)] max-w-[200px] truncate">
                        {cred.notes || "—"}
                      </td>

                      {/* Keep-Alive */}
                      <td className="py-3 px-4">
                        {(cred.keep_alive_minutes ?? 0) > 0 ? (
                          <button
                            type="button"
                            onClick={() => toggleKeepAlive(cred.profile_id, cred.provider, 0)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-rose-500/10 hover:text-rose-600 px-2 py-0.5 rounded-[10px] border border-emerald-500/20 hover:border-rose-500/20 transition-colors cursor-pointer"
                            title={t("credentials.stopKeepAlive")}
                          >
                            <ClockIcon className="size-3" />
                            {cred.keep_alive_minutes}m
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleKeepAlive(cred.profile_id, cred.provider, 15)}
                            className="text-[11.5px] text-[var(--color-mid-gray,#737373)] hover:text-indigo-600 cursor-pointer"
                            title={t("credentials.enableKeepAlive")}
                          >
                            {t("credentials.keepAliveOff")}
                          </button>
                        )}
                      </td>

                      {/* Last Used */}
                      <td className="py-3 px-4 font-mono text-[11px] text-[var(--color-mid-gray,#737373)]">
                        {formatTimestamp(cred.last_used)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Autofill Button */}
                          <button
                            type="button"
                            onClick={() => handleAutofill(cred)}
                            disabled={!isRunning || isAutofilling}
                            title={
                              isRunning
                                ? t("credentials.autofillTitle")
                                : t("credentials.autofillDisabledTitle")
                            }
                            className={`flex items-center gap-1 rounded-[14px] px-2.5 py-1 text-[11.5px] font-medium transition-all cursor-pointer ${
                              isRunning
                                ? "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border border-indigo-500/20"
                                : "opacity-40 cursor-not-allowed bg-[var(--color-canvas,#f5f5f5)] text-[var(--color-mid-gray,#737373)] border border-transparent"
                            }`}
                          >
                            <PlayIcon className="size-3" />
                            <span>{isAutofilling ? t("credentials.autofilling") : t("credentials.autofill")}</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => onEdit(cred)}
                            className="rounded-[12px] p-1.5 text-[var(--color-mid-gray,#737373)] hover:bg-[var(--color-canvas,#f5f5f5)] hover:text-[var(--color-ink,#0a0a0a)] transition-colors cursor-pointer"
                            title={t("credentials.editTitle")}
                          >
                            <EditIcon className="size-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(cred)}
                            className="rounded-[12px] p-1.5 text-[var(--color-mid-gray,#737373)] hover:bg-rose-500/10 hover:text-rose-600 transition-colors cursor-pointer"
                            title={t("credentials.deleteTitle")}
                          >
                            <DeleteIcon className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
