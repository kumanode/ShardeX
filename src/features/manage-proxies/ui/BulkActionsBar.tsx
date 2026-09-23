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
    <div className="flex items-center gap-2 rounded-[20px] bg-sky-500/10 dark:bg-sky-500/15 py-1.5 pl-4 pr-1.5 text-label-xs text-sky-700 dark:text-sky-300 border border-sky-500/30 relative shadow-sm">
      <span className="font-mono font-bold text-[12px] mr-1">{t("bulkActionsBar.selectedCount", { n: count })}</span>
      <Button variant="neutral" mode="stroke" size="xsmall" leftIcon={<RefreshIcon className="size-4" />} onClick={bulkTest}>{t("bulkActionsBar.test")}</Button>
      <Button variant="primary" mode="stroke" size="xsmall" leftIcon={<SyncIcon className="size-4 text-sky-500" />} onClick={() => setDistributeOpen(true)}>{t("bulkActionsBar.distribute")}</Button>
      <Button variant="neutral" mode="stroke" size="xsmall" leftIcon={<UploadIcon className="size-4" />} onClick={bulkExport}>{t("bulkActionsBar.export")}</Button>
      <Button variant="error" mode="stroke" size="xsmall" className="hover:!bg-rose-500/10" leftIcon={<DeleteIcon className="size-4 text-rose-500" />} onClick={bulkDelete}>{t("bulkActionsBar.delete")}</Button>
      <Button variant="neutral" mode="ghost" size="xsmall" onClick={clearSelected}>{t("bulkActionsBar.clear")}</Button>
    </div>
  );
}
