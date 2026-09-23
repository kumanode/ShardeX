import { useEffect, useRef, useState } from "react";
import { Button, DialogModal, Input } from "@proxyshard/shardx-ui-kit";
import { FolderIcon } from "../../../shared/icons";
import { useT } from "../../../shared/i18n";

/// Folder picker/creator modal (replaces native prompt). mode: "create" | "move".
export function FolderModal({
  mode, existing, onPick, onCreate, onClose,
}: {
  mode: "create" | "move";
  existing: string[];
  onPick: (folder: string) => void;
  onCreate: (name: string) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const trimmed = name.trim();
  const dup = existing.includes(trimmed);
  const create = () => { if (trimmed && !dup) onCreate(trimmed); };
  const showList = mode === "move" && existing.length > 0;
  return (
    <DialogModal
      open
      onClose={onClose}
      icon={<FolderIcon className="size-5" />}
      title={mode === "move" ? t("folderModal.moveTitle") : t("folderModal.createTitle")}
      confirmLabel={showList ? t("folderModal.createAndMove") : t("folderModal.create")}
      onConfirm={create}
      isDisabled={!trimmed || dup}
      cancelLabel={t("folderModal.cancel")}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-3 py-1">
        {showList && (
          <>
            <span className="text-label-xs font-medium text-zinc-600 dark:text-zinc-300">{t("folderModal.existingFolders")}</span>
            <div className="flex max-h-[220px] flex-col gap-1 overflow-y-auto pr-0.5">
              {existing.map((f) => (
                <Button
                  key={f}
                  variant="neutral"
                  mode="stroke"
                  size="small"
                  className="w-full justify-start rounded-[12px] !h-9 text-zinc-800 dark:text-zinc-200 hover:bg-[var(--color-surface-alt,#fafafa)]"
                  leftIcon={<FolderIcon className="size-4 text-zinc-400 dark:text-zinc-500" />}
                  onClick={() => onPick(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
            <div className="my-1 flex items-center gap-2.5 text-paragraph-xs text-zinc-400 dark:text-zinc-500 [&::before]:h-px [&::before]:flex-1 [&::before]:bg-[var(--color-hairline,#e5e5e5)] [&::before]:content-[''] [&::after]:h-px [&::after]:flex-1 [&::after]:bg-[var(--color-hairline,#e5e5e5)] [&::after]:content-['']">
              <span>{t("folderModal.orCreateNew")}</span>
            </div>
          </>
        )}
        <Input
          ref={ref}
          label={showList ? t("folderModal.newFolderNameLabel") : t("folderModal.folderNameLabel")}
          inputSize="small"
          value={name}
          placeholder={t("folderModal.namePlaceholder")}
          error={dup ? t("folderModal.duplicateError", { name: trimmed }) : undefined}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") create();
            if (e.key === "Escape") onClose();
          }}
        />
      </div>
    </DialogModal>
  );
}
