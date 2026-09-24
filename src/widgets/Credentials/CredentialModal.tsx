import { useState, useEffect } from "react";
import { DialogModal, Input, Select, Textarea } from "@proxyshard/shardx-ui-kit";
import { useCredentials, type Credential } from "../../entities/credentials";
import { useProfile } from "../../entities/profile";
import { KeyIcon, EditIcon } from "../../shared/icons";
import { useT } from "../../shared/i18n";

export function CredentialModal({
  open,
  initial,
  onClose,
}: {
  open: boolean;
  initial?: Credential | null;
  onClose: () => void;
}) {
  const t = useT();
  const profiles = useProfile((s) => s.profiles);
  const providers = useCredentials((s) => s.providers);
  const add = useCredentials((s) => s.add);
  const update = useCredentials((s) => s.update);

  const [profileId, setProfileId] = useState(initial?.profile_id || (profiles[0]?.id ?? ""));
  const [provider, setProvider] = useState(initial?.provider || "gmail");
  const [email, setEmail] = useState(initial?.email || "");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [keepAliveMinutes, setKeepAliveMinutes] = useState(initial?.keep_alive_minutes ?? 0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initial) {
      setProfileId(initial.profile_id);
      setProvider(initial.provider);
      setEmail(initial.email);
      setPassword("");
      setNotes(initial.notes || "");
      setKeepAliveMinutes(initial.keep_alive_minutes ?? 0);
    } else {
      setProfileId(profiles[0]?.id ?? "");
      setProvider("gmail");
      setEmail("");
      setPassword("");
      setNotes("");
      setKeepAliveMinutes(0);
    }
  }, [initial, profiles]);

  const isEdit = !!initial;

  const handleSave = async () => {
    if (!profileId) return;
    setBusy(true);
    const cred: Credential = {
      id: initial?.id || crypto.randomUUID().slice(0, 8),
      profile_id: profileId,
      provider,
      email: email.trim(),
      password,
      notes: notes.trim() || null,
      created_at: initial?.created_at || Math.floor(Date.now() / 1000),
      last_used: initial?.last_used || 0,
      keep_alive_minutes: Number(keepAliveMinutes),
    };

    let ok = false;
    if (isEdit) {
      ok = await update(cred);
    } else {
      ok = await add(cred);
    }
    setBusy(false);
    if (ok) {
      onClose();
    }
  };

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

  const keepAliveOptions = [
    { value: "0", label: t("credentials.keepAliveOff") },
    { value: "15", label: t("credentials.every15m") },
    { value: "30", label: t("credentials.every30m") },
    { value: "60", label: t("credentials.every60m") },
  ];

  return (
    <DialogModal
      open={open}
      onClose={onClose}
      icon={isEdit ? <EditIcon className="size-5" /> : <KeyIcon className="size-5" />}
      title={isEdit ? t("credentials.editAccount") : t("credentials.addAccount")}
      confirmLabel={t("credentials.save")}
      onConfirm={handleSave}
      isDisabled={busy || !email.trim() || (!isEdit && !password.trim()) || !profileId}
      cancelLabel={t("credentials.cancel")}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-3.5 py-1">
        <div>
          <Select
            label={t("credentials.profile")}
            value={profileId}
            onChange={(v) => setProfileId(String(v))}
            options={profileOptions}
          />
        </div>

        <div>
          <Select
            label={t("credentials.provider")}
            value={provider}
            onChange={(v) => setProvider(String(v))}
            options={providerOptions}
          />
        </div>

        <div>
          <Input
            label={t("credentials.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("credentials.emailPlaceholder")}
          />
        </div>

        <div>
          <Input
            label={
              isEdit
                ? `${t("credentials.password")} ${t("credentials.keepPasswordHint")}`
                : t("credentials.password")
            }
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
          />
        </div>

        <div>
          <Select
            label={t("credentials.keepAliveTitle")}
            value={String(keepAliveMinutes)}
            onChange={(v) => setKeepAliveMinutes(Number(v))}
            options={keepAliveOptions}
          />
        </div>

        <div>
          <Textarea
            label={t("credentials.notes")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("credentials.notesPlaceholder")}
            rows={2}
          />
        </div>
      </div>
    </DialogModal>
  );
}
