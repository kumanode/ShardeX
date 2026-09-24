import { Button } from "@proxyshard/shardx-ui-kit";
import { RefreshIcon, UploadIcon, DeleteIcon, SyncIcon } from "../../../shared/icons";
import { useProxy } from "../../../entities/proxy";
import { useT } from "../../../shared/i18n";

export function BulkActionsBar() {
  const t = useT();
  const count = useProxy((s) => s.proxySel.size);
  const bulkTest = useProxy((s) => s.bulkTest);
  const bulkExport = useProxy((s) => s.bulkExport);
  const bulkDelete = useProxy((s) => s.bulkDelete);
  const clearSelected = useProxy((s) => s.clearSelected);
  const setDistributeOpen = useProxy((s) => s.setDistributeOpen);

  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-[18px] bg-[var(--color-paper,#ffffff)] py-1.5 pl-3.5 pr-1.5 text-label-xs text-[var(--color-ink,#0a0a0a)] border border-[var(--color-hairline,#e5e5e5)] relative shadow-[var(--shadow-subtle)]">
      <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-[10px] bg-[var(--color-canvas,#f5f5f5)] text-[var(--color-ink,#0a0a0a)] border border-[var(--color-hairline,#e5e5e5)] mr-1">{t("bulkActionsBar.selectedCount", { n: count })}</span>
      <Button variant="neutral" mode="stroke" size="xsmall" leftIcon={<RefreshIcon className="size-4" />} onClick={bulkTest}>{t("bulkActionsBar.test")}</Button>
      <Button variant="neutral" mode="stroke" size="xsmall" leftIcon={<SyncIcon className="size-4" />} onClick={() => setDistributeOpen(true)}>{t("bulkActionsBar.distribute")}</Button>
      <Button variant="neutral" mode="stroke" size="xsmall" leftIcon={<UploadIcon className="size-4" />} onClick={bulkExport}>{t("bulkActionsBar.export")}</Button>
      <Button variant="error" mode="stroke" size="xsmall" className="hover:!bg-rose-500/10" leftIcon={<DeleteIcon className="size-4 text-rose-500" />} onClick={bulkDelete}>{t("bulkActionsBar.delete")}</Button>
      <Button variant="neutral" mode="ghost" size="xsmall" onClick={clearSelected}>{t("bulkActionsBar.clear")}</Button>
    </div>
  );
}
