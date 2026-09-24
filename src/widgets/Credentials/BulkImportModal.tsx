import { useState, useMemo } from "react";
import { DialogModal, Select, Textarea } from "@proxyshard/shardx-ui-kit";
import { useCredentials, type Credential } from "../../entities/credentials";
import { useProfile } from "../../entities/profile";
import { UploadIcon } from "../../shared/icons";
import { toast } from "../../shared/model/toast";
import { useT } from "../../shared/i18n";

type ParsedRow = {
  profileId: string;
  provider: string;
  email: string;
  password: string;
  notes?: string;
};

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
  const add = useCredentials((s) => s.add);

  const [mode, setMode] = useState<"single" | "round-robin">("round-robin");
  const [selectedProfileId, setSelectedProfileId] = useState(profiles[0]?.id ?? "");
  const [defaultProvider, setDefaultProvider] = useState("gmail");
  const [rawText, setRawText] = useState("");
  const [busy, setBusy] = useState(false);

  const providerOptions = providers.length > 0
    ? providers.map((p) => ({ value: p.id, label: p.name }))
    : [
        { value: "gmail", label: "Google / Gmail" },
        { value: "x", label: "X / Twitter" },
        { value: "discord", label: "Discord" },
        { value: "telegram", label: "Telegram" },
        { value: "github", label: "GitHub" },
        { value: "generic", label: "Custom / Generic" },
      ];

  const profileOptions = profiles.map((p) => ({
    value: p.id,
    label: `${p.name || p.id} (${p.id})`,
  }));

  const modeOptions = [
    { value: "round-robin", label: t("credentials.bulkRoundRobin") },
    { value: "single", label: t("credentials.bulkSingle") },
  ];

  // Parse lines
  const parsedRows: ParsedRow[] = useMemo(() => {
    if (!rawText.trim() || profiles.length === 0) return [];
    const lines = rawText.split("\n");
    const results: ParsedRow[] = [];

    let profileIdx = 0;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || line.startsWith("//")) continue;

      // Delimiters supported: ':' or ',' or '\t' or ';'
      let parts: string[] = [];
      if (line.includes("\t")) {
        parts = line.split("\t").map((p) => p.trim());
      } else if (line.includes(":")) {
        parts = line.split(":").map((p) => p.trim());
      } else if (line.includes(",")) {
        parts = line.split(",").map((p) => p.trim());
      } else if (line.includes(";")) {
        parts = line.split(";").map((p) => p.trim());
      }

      if (parts.length >= 2) {
        let assignedProfile = selectedProfileId;
        if (mode === "round-robin") {
          assignedProfile = profiles[profileIdx % profiles.length].id;
          profileIdx++;
        }

        const email = parts[0];
        const password = parts[1];
        const notes = parts.slice(2).join(" | ") || undefined;

        if (email && password) {
          results.push({
            profileId: assignedProfile,
            provider: defaultProvider,
            email,
            password,
            notes,
          });
        }
      }
    }
    return results;
  }, [rawText, mode, selectedProfileId, defaultProvider, profiles]);

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    setBusy(true);

    let imported = 0;
    let failed = 0;

    for (const row of parsedRows) {
      const cred: Credential = {
        id: crypto.randomUUID().slice(0, 8),
        profile_id: row.profileId,
        provider: row.provider,
        email: row.email,
        password: row.password,
        notes: row.notes || null,
        created_at: Math.floor(Date.now() / 1000),
        last_used: 0,
        keep_alive_minutes: 0,
      };

      try {
        const ok = await add(cred);
        if (ok) imported++;
        else failed++;
      } catch {
        failed++;
      }
    }

    setBusy(false);
    toast.ok(`Imported ${imported} accounts into vault.${failed > 0 ? ` (${failed} failed)` : ""}`);
    onClose();
  };

  return (
    <DialogModal
      open={open}
      onClose={onClose}
      icon={<UploadIcon className="size-5" />}
      title={t("credentials.bulkTitle")}
      confirmLabel={busy ? t("credentials.bulkImporting") : t("credentials.bulkImportBtn", { n: parsedRows.length })}
      onConfirm={handleImport}
      isDisabled={busy || parsedRows.length === 0}
      cancelLabel={t("credentials.cancel")}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-3.5 py-1">
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
user3@gmail.com:Secret789:seed phrase or notes`}
            rows={6}
          />
          <span className="mt-1 block font-mono text-[11px] text-[var(--color-mid-gray,#737373)]">
            Supported delimiters: colon (:), tab, comma (,), semicolon (;). Blank lines & lines starting with # are ignored.
          </span>
        </div>

        {/* Live Preview Count */}
        <div className="rounded-[14px] bg-[var(--color-canvas,#f5f5f5)] p-3 border border-[var(--color-hairline,#e5e5e5)] flex items-center justify-between text-[12.5px]">
          <span className="text-[var(--color-mid-gray,#737373)]">
            {t("credentials.bulkValidParsed")}
          </span>
          <span className="font-mono font-semibold text-[var(--color-ink,#0a0a0a)]">
            {parsedRows.length} {parsedRows.length === 1 ? "account" : "accounts"}
          </span>
        </div>
      </div>
    </DialogModal>
  );
}
