import { useMemo, useState } from "react";
import { Button } from "@proxyshard/shardx-ui-kit";
import {
  PlayIcon,
  StopIcon,
  UploadIcon,
  DeleteIcon,
  SyncIcon,
  RouteIcon,
  FolderIcon,
} from "../../../shared/icons";
import { useProfile, useSyncBlockReason } from "../../../entities/profile";
import { useT } from "../../../shared/i18n";

export function BulkActionsBar() {
  const t = useT();
  const count = useProfile((s) => s.selected.size);
  const proxies = useProfile((s) => s.proxies);
  const profiles = useProfile((s) => s.profiles);
  // Derived outside the selector: returning a fresh array from a selector
  // retriggers the snapshot on every render (infinite loop).
  const folders = useMemo(() => {
    const list = new Set<string>();
    profiles.forEach((p) => { if (p.folder) list.add(p.folder); });
    return [...list];
  }, [profiles]);
  const bulkLaunch = useProfile((s) => s.bulkLaunch);
  const bulkLaunchSynced = useProfile((s) => s.bulkLaunchSynced);
  const bulkStop = useProfile((s) => s.bulkStop);
  const bulkExport = useProfile((s) => s.bulkExport);
  const bulkDelete = useProfile((s) => s.bulkDelete);
  const bulkBindProxy = useProfile((s) => s.bulkBindProxy);
  const bulkSetFolder = useProfile((s) => s.bulkSetFolder);
  const clearSelected = useProfile((s) => s.clearSelected);
  const syncBlocked = useSyncBlockReason();

  const [showProxyMenu, setShowProxyMenu] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-[20px] bg-indigo-500/10 dark:bg-indigo-500/15 py-1.5 pl-4 pr-1.5 text-label-xs text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 relative shadow-sm">
      <span className="font-mono font-bold text-[12px] mr-1">{t("bulkActionsBar.selectedCount", { n: count })}</span>
      <Button variant="neutral" mode='stroke' size="xsmall" className="hover:!text-emerald-600 hover:!border-emerald-500/30" leftIcon={<PlayIcon className="size-4 text-emerald-500" />} onClick={bulkLaunch}>{t("bulkActionsBar.launch")}</Button>
      {count >= 2 && (
        <span title={syncBlocked || t("bulkActionsBar.launchSyncedHint")}>
          <Button
            variant="neutral"
            mode="stroke"
            size="xsmall"
            disabled={!!syncBlocked}
            leftIcon={<SyncIcon className="size-4" />}
            onClick={bulkLaunchSynced}
          >
            {t("bulkActionsBar.launchSynced")}
          </Button>
        </span>
      )}

      {/* Bulk Proxy Assign */}
      <div className="relative">
        <Button
          variant="neutral"
          mode="stroke"
          size="xsmall"
          leftIcon={<RouteIcon className="size-4" />}
          onClick={() => { setShowProxyMenu(!showProxyMenu); setShowFolderMenu(false); }}
        >
          {t("bulkActionsBar.assignProxy")}
        </Button>
        {showProxyMenu && (
          <div className="absolute left-0 top-full mt-1.5 z-50 flex max-h-56 w-56 flex-col overflow-y-auto rounded-[18px] bg-[var(--color-paper,#ffffff)] p-1.5 shadow-[var(--shadow-subtle)] border border-[var(--color-hairline,#e5e5e5)]">
            <button
              className="rounded-lg px-2.5 py-1.5 text-left font-mono text-[12px] text-zinc-600 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
              onClick={() => { void bulkBindProxy(null); setShowProxyMenu(false); }}
            >
              Direct (No Proxy)
            </button>
            {proxies.map((px) => (
              <button
                key={px.id}
                className="truncate rounded-lg px-2.5 py-1.5 text-left font-mono text-[12px] text-zinc-800 dark:text-zinc-200 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                onClick={() => { void bulkBindProxy(px.id); setShowProxyMenu(false); }}
              >
                {px.name || `${px.host}:${px.port}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Folder Move */}
      <div className="relative">
        <Button
          variant="neutral"
          mode="stroke"
          size="xsmall"
          leftIcon={<FolderIcon className="size-4" />}
          onClick={() => { setShowFolderMenu(!showFolderMenu); setShowProxyMenu(false); }}
        >
          {t("bulkActionsBar.assignFolder")}
        </Button>
        {showFolderMenu && (
          <div className="absolute left-0 top-full mt-1.5 z-50 flex max-h-56 w-48 flex-col overflow-y-auto rounded-[18px] bg-[var(--color-paper,#ffffff)] p-1.5 shadow-[var(--shadow-subtle)] border border-[var(--color-hairline,#e5e5e5)]">
            <button
              className="rounded-lg px-2.5 py-1.5 text-left font-mono text-[12px] text-zinc-600 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
              onClick={() => { void bulkSetFolder(""); setShowFolderMenu(false); }}
            >
              Root (No Folder)
            </button>
            {folders.map((f) => (
              <button
                key={f}
                className="truncate rounded-lg px-2.5 py-1.5 text-left font-mono text-[12px] text-zinc-800 dark:text-zinc-200 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                onClick={() => { void bulkSetFolder(f); setShowFolderMenu(false); }}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      <Button variant="neutral" mode="stroke" size="xsmall" className="hover:!text-rose-600 hover:!border-rose-500/30" leftIcon={<StopIcon className="size-4 text-rose-500" />} onClick={bulkStop}>{t("bulkActionsBar.stop")}</Button>
      <Button variant="neutral" mode="stroke" size="xsmall" leftIcon={<UploadIcon className="size-4" />} onClick={bulkExport}>{t("bulkActionsBar.export")}</Button>
      <Button variant="error" mode="stroke" size="xsmall" className="hover:!bg-rose-500/10" leftIcon={<DeleteIcon className="size-4 text-rose-500" />} onClick={bulkDelete}>{t("bulkActionsBar.delete")}</Button>
      <Button variant="neutral" mode="ghost" size="xsmall" onClick={clearSelected}>{t("bulkActionsBar.clear")}</Button>
    </div>
  );
}
