import { useState } from "react";
import { DialogModal, Input, Select } from "@proxyshard/shardx-ui-kit";
import { useProfile } from "../../../entities/profile";
import { toast } from "../../../shared/model/toast";
import { profileSave } from "../../../entities/profile";
import { useT } from "../../../shared/i18n";

export function BulkGeneratorModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const fingerprints = useProfile((s) => s.fingerprints);
  const proxies = useProfile((s) => s.proxies);
  const reload = useProfile((s) => s.reload);

  const [count, setCount] = useState(5);
  const [namePrefix, setNamePrefix] = useState("profile");
  const [platform, setPlatform] = useState<"all" | "windows" | "mac" | "linux" | "android">("all");
  const [proxyStrategy, setProxyStrategy] = useState<"none" | "round-robin">("none");
  const [folder, setFolder] = useState("");
  const [busy, setBusy] = useState(false);
  const t = useT();

  const handleGenerate = async () => {
    if (count < 1 || count > 100) return toast.err(t("bulkGen.errRange"));
    if (fingerprints.length === 0) return toast.err(t("bulkGen.errNoFp"));

    setBusy(true);
    let created = 0;
    try {
      const candidates = fingerprints.filter((fp) => {
        if (platform === "all") return true;
        const os = (fp.platform || fp.payload?.navigator?.platform || "").toLowerCase();
        return os.includes(platform);
      });

      const pool = candidates.length > 0 ? candidates : fingerprints;

      for (let i = 1; i <= count; i++) {
        const fp = pool[Math.floor(Math.random() * pool.length)];
        const base = fp?.payload ? JSON.parse(JSON.stringify(fp.payload)) : {};
        const id = crypto.randomUUID().slice(0, 8);
        const name = `${namePrefix}-${i.toString().padStart(2, "0")}`;

        let assignedProxy: string | null = null;
        if (proxyStrategy === "round-robin" && proxies.length > 0) {
          assignedProxy = proxies[(i - 1) % proxies.length].id;
        }

        base._meta = {
          id,
          proxy_id: assignedProxy,
          folder: folder.trim(),
          gpu_preset_id: fp.id,
          created_at: `@${Math.floor(Date.now() / 1000)}`,
        };
        base.name = name;

        await profileSave(base);
        created++;
      }

      toast.ok(t("bulkGen.okCreated", { n: created }));
      reload();
      onClose();
    } catch (e) {
      toast.err(t("bulkGen.errPartial", { e: String(e) }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogModal
      open={open}
      onClose={onClose}
      title={t("bulkGen.title")}
      confirmLabel={busy ? t("bulkGen.generating") : t("bulkGen.generate")}
      onConfirm={handleGenerate}
      cancelLabel={t("bulkGen.cancel")}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-3.5 py-1">
        <Input
          label={t("bulkGen.count")}
          inputSize="small"
          type="number"
          min={1}
          max={100}
          value={String(count)}
          onChange={(e) => setCount(Number(e.target.value))}
        />

        <Input
          label={t("bulkGen.namePrefix")}
          inputSize="small"
          value={namePrefix}
          onChange={(e) => setNamePrefix(e.target.value)}
          placeholder={t("bulkGen.namePlaceholder")}
        />

        <Select
          label={t("bulkGen.platform")}
          size="small"
          value={platform}
          onChange={(v) => setPlatform(v as typeof platform)}
          options={[
            { value: "all", label: t("bulkGen.platformAll") },
            { value: "windows", label: t("bulkGen.platformWindows") },
            { value: "mac", label: t("bulkGen.platformMac") },
            { value: "linux", label: t("bulkGen.platformLinux") },
            { value: "android", label: t("bulkGen.platformAndroid") },
          ]}
        />

        <Select
          label={t("bulkGen.proxyStrategy")}
          size="small"
          value={proxyStrategy}
          onChange={(v) => setProxyStrategy(v as typeof proxyStrategy)}
          options={[
            { value: "none", label: t("bulkGen.proxyNone") },
            { value: "round-robin", label: t("bulkGen.proxyRoundRobin", { n: proxies.length }) },
          ]}
        />

        <Input
          label={t("bulkGen.folder")}
          inputSize="small"
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          placeholder={t("bulkGen.folderPlaceholder")}
        />
      </div>
    </DialogModal>
  );
}
