import { useState, useMemo, useEffect } from "react";
import { DialogModal, Select, Textarea } from "@proxyshard/shardx-ui-kit";
import { useCredentials, type Credential, PROVIDER_FALLBACK } from "../../entities/credentials";
import { useProfile } from "../../entities/profile";
import { UploadIcon } from "../../shared/icons";
import { useT } from "../../shared/i18n";

type ParsedRow = {
  profileId: string;
  provider: string;
  email: string;
  password: string;
  notes?: string;
};

function detectProvider(email: string, fallback: string): string {
  const lower = email.toLowerCase();
  if (lower.includes("@gmail.") || lower.includes("@googlemail.")) return "gmail";
  if (lower.includes("@x.com") || lower.includes("@twitter.")) return "x";
  if (lower.includes("@discord.")) return "discord";
  if (lower.includes("@telegram.") || lower.includes("@t.me")) return "telegram";
  if (lower.includes("@github.")) return "github";
  return fallback;
}

export function BulkImportModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const profiles = useProfile((s) => s.profiles);
  const providers = useCredentials((s) => s.providers);
  const addBatch = useCredentials((s) => s.addBatch);

  const [mode, setMode] = useState<"single" | "round-robin">("round-robin");
  const [selectedProfileId, setSelectedProfileId] = useState(profiles[0]?.id ?? "");
  const [defaultProvider, setDefaultProvider] = useState("auto");
  const [rawText, setRawText] = useState("");
  const [busy, setBusy] = useState(false);

  // Sync selectedProfileId when profiles load asynchronously
  useEffect(() => {
    if (!selectedProfileId && profiles.length > 0) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [profiles, selectedProfileId]);

  const rawProviderOptions = providers.length > 0
    ? providers.map((p) => ({ value: p.id, label: p.name }))
    : PROVIDER_FALLBACK.map((p) => ({ value: p.id, label: p.name }));

  const providerOptions = [
    { value: "auto", label: t("credentials.bulkAutoDetect") },
    ...rawProviderOptions,
  ];

  const profileOptions = profiles.map((p) => ({
    value: p.id,
    label: `${p.name || p.id} (${p.id})`,
  }));

  const modeOptions = [
    { value: "round-robin", label: t("credentials.bulkRoundRobin") },
    { value: "single", label: t("credentials.bulkSingle") },
  ];

  const profileMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of profiles) {
      map.set(p.id, p.name || p.id);
    }
    return map;
  }, [profiles]);

  // Parse lines with resilient delimiter handling
  const { parsedRows, skippedCount } = useMemo(() => {
    if (!rawText.trim() || profiles.length === 0) {
      return { parsedRows: [], skippedCount: 0 };
    }
    const lines = rawText.split("\n");
    const results: ParsedRow[] = [];
    let skipped = 0;

    let profileIdx = 0;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || line.startsWith("//")) continue;

      let parts: string[] = [];
      if (line.includes("\t")) {
        parts = line.split("\t").map((p) => p.trim());
      } else if (line.includes(";")) {
        parts = line.split(";").map((p) => p.trim());
      } else if (line.includes(",")) {
        parts = line.split(",").map((p) => p.trim());
      } else if (line.includes(":")) {
        const c1 = line.indexOf(":");
        const email = line.slice(0, c1).trim();
        const rest = line.slice(c1 + 1).trim();
        // Support email:password:notes safely
        const c2 = rest.indexOf(":");
        if (c2 !== -1) {
          parts = [email, rest.slice(0, c2).trim(), rest.slice(c2 + 1).trim()];
        } else {
          parts = [email, rest];
        }
      }

      if (parts.length >= 2) {
        const email = parts[0];
        const password = parts[1];
        const notes = parts.slice(2).join(" | ") || undefined;

        if (email && password) {
          let assignedProfile = selectedProfileId || profiles[0]?.id || "";
          if (mode === "round-robin") {
            assignedProfile = profiles[profileIdx % profiles.length].id;
            profileIdx++;
          }

          const provider = defaultProvider === "auto"
            ? detectProvider(email, "gmail")
            : defaultProvider;

          results.push({
            profileId: assignedProfile,
            provider,
            email,
            password,
            notes,
          });
          continue;
        }
      }

      skipped++;
    }
    return { parsedRows: results, skippedCount: skipped };
  }, [rawText, mode, selectedProfileId, defaultProvider, profiles]);

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    setBusy(true);

    const credsToImport: Credential[] = parsedRows.map((row) => ({
      id: crypto.randomUUID(),
      profile_id: row.profileId,
      provider: row.provider,
      email: row.email,
      password: row.password,
      notes: row.notes || null,
      created_at: Math.floor(Date.now() / 1000),
      last_used: 0,
      keep_alive_minutes: 0,
    }));

    const count = await addBatch(credsToImport);
    setBusy(false);
    if (count > 0) {
      onClose();
    }
  };

  return (
    <DialogModal
      open={open}
      onClose={onClose}
      icon={<UploadIcon className="size-5" />}
      title={t("credentials.bulkTitle")}
      confirmLabel={busy ? t("credentials.bulkImporting") : t("credentials.bulkImportBtn", { n: parsedRows.length })}
      onConfirm={handleImport}
      isDisabled={busy || parsedRows.length === 0 || profiles.length === 0}
      cancelLabel={t("credentials.cancel")}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-3.5 py-1">
        {profiles.length === 0 && (
          <div className="rounded-[14px] bg-amber-500/10 border border-amber-500/20 p-3 text-[12.5px] font-medium text-amber-700 dark:text-amber-400">
            {t("credentials.bulkNoProfiles")}
          </div>
        )}

        <div>
          <Select
            label={t("credentials.bulkStrategy")}
            value={mode}
            onChange={(v) => setMode(v as "single" | "round-robin")}
            options={modeOptions}
          />
        </div>

        {mode === "single" && (
          <div>
            <Select
              label={t("credentials.bulkTargetProfile")}
              value={selectedProfileId}
              onChange={(v) => setSelectedProfileId(String(v))}
              options={profileOptions}
            />
          </div>
        )}

        <div>
          <Select
            label={t("credentials.bulkDefaultProvider")}
            value={defaultProvider}
            onChange={(v) => setDefaultProvider(String(v))}
            options={providerOptions}
          />
        </div>

        <div>
          <Textarea
            label={t("credentials.bulkAccountsList")}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`user1@gmail.com:Pass123!
user2@gmail.com:Pass456!:recovery_email@mail.com
user3@x.com:Secret789:2FA_SECRET_OR_NOTES`}
            rows={5}
          />
          <span className="mt-1 block font-mono text-[11px] text-[var(--color-mid-gray,#737373)]">
            Supported delimiters: colon (:), tab, comma (,), semicolon (;). Blank lines & lines starting with # are ignored.
          </span>
        </div>

        {/* Skipped lines alert */}
        {skippedCount > 0 && (
          <div className="rounded-[12px] bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-[11.5px] text-amber-700 dark:text-amber-400">
            {t("credentials.bulkSkipped", { n: skippedCount })}
          </div>
        )}

        {/* Live Preview List */}
        {parsedRows.length > 0 && (
          <div className="rounded-[14px] border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] p-2.5">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-mono text-[var(--color-mid-gray,#737373)]">
              <span>{t("credentials.bulkPreview", { n: Math.min(parsedRows.length, 3) })}</span>
              <span className="font-semibold text-[var(--color-ink,#0a0a0a)]">
                {t("credentials.bulkValidParsed")} {parsedRows.length}
              </span>
            </div>
            <div className="space-y-1">
              {parsedRows.slice(0, 3).map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-[8px] bg-[var(--color-paper,#ffffff)] px-2.5 py-1 text-[11px] border border-[var(--color-hairline,#e5e5e5)]"
                >
                  <span className="font-medium truncate max-w-[130px] text-[var(--color-ink,#0a0a0a)]">
                    {r.email}
                  </span>
                  <span className="font-mono text-zinc-400">••••••••</span>
                  <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                    {r.provider}
                  </span>
                  <span className="truncate max-w-[100px] text-zinc-500 font-mono text-[10px]">
                    {profileMap.get(r.profileId) || r.profileId}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DialogModal>
  );
}
