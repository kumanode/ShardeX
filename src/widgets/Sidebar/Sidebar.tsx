import { useEffect, useState, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button, cn } from "@proxyshard/shardx-ui-kit";
import Badge from "../../shared/ui/Badge";
import {
  NavBrowsersIcon,
  RouteIcon,
  NavShopIcon,
  NavFingerprintsIcon,
  NavSettingsIcon,
  NavPatchLogIcon,
  NavExtensionsIcon,
  NavBookmarksIcon,
  NavTrashIcon,
  NavAutomationIcon,
  CopyIcon,
  DocsIcon,
  ShardLogo,
  ShardMini,
} from "../../shared/icons";
import { clip } from "../../shared/lib/clipboard";
import { toast } from "../../shared/model/toast";
import { withUtm } from "../../shared/lib/utils";
import type { RtUpdate, Section } from "../../shared/types";
import { useNav } from "../../shared/model/navigation";
import { useT } from "../../shared/i18n";
import { DownloadMcp } from "../../features/DownloadMcp";
import { ThemeSwitch } from "../../features/ThemeSwitch";

function VersionPill() {
  const t = useT();
  const [info, setInfo] = useState<RtUpdate | null>(null);
  useEffect(() => {
    invoke<RtUpdate>("launcher_update_check").then(setInfo).catch(() => {});
  }, []);
  const open = () => {
    if (info?.release_url) openUrl(info.release_url).catch(() => {});
  };
  const clickable = !!info?.release_url;
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[18px] border border-transparent bg-transparent px-3 py-2 text-left text-[var(--color-ink,#0a0a0a)] transition-colors",
        info?.update_available
          ? "cursor-pointer border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-canvas,#f5f5f5)] hover:border-[var(--color-ink,#0a0a0a)]"
          : "cursor-default hover:enabled:bg-[var(--color-canvas,#f5f5f5)] disabled:opacity-85",
      )}
      onClick={open}
      disabled={!clickable}
      title={
        info?.update_available
          ? t("sidebar.updateTitle", { v: info.latest ?? "" })
          : info
            ? info.latest
              ? t("sidebar.runningWithRemote", { v: info.current, latest: info.latest })
              : t("sidebar.running", { v: info.current })
            : t("sidebar.checkingTitle")
      }
    >
      <span className="text-indigo-600 dark:text-indigo-400"><ShardMini /></span>
      <div className="flex min-w-0 flex-col">
        <div className="text-label-xs font-medium">{t("sidebar.launcherVersion", { v: info?.current ?? "…" })}</div>
        <div className="text-paragraph-xs text-[var(--color-mid-gray,#737373)] flex items-center gap-1.5">
          {info === null ? (
            t("sidebar.checkingStatus")
          ) : info.update_available ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {t("sidebar.updateStatus", { v: info.latest ?? "" })}
            </span>
          ) : info.latest ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {t("sidebar.upToDate")}
            </span>
          ) : (
            t("sidebar.offline")
          )}
        </div>
      </div>
    </button>
  );
}

export function Sidebar() {
  const t = useT();
  const section = useNav((s) => s.section);
  const setSection = useNav((s) => s.setSection);

  const sections: { label: string; items: { id: Section; label: string; svg: ReactNode }[] }[] = [
    {
      label: t("sidebar.groupWorkspace"),
      items: [
        { id: "browsers", label: t("sidebar.navBrowsers"), svg: <NavBrowsersIcon className="size-5" /> },
        { id: "proxies", label: t("sidebar.navProxies"), svg: <RouteIcon className="size-5" /> },
        { id: "proxyshard", label: "ProxyShard", svg: <NavShopIcon className="size-5" /> },
        { id: "automation", label: t("sidebar.navAutomation"), svg: <NavAutomationIcon className="size-5" /> },
      ],
    },
    {
      label: t("sidebar.groupLibrary"),
      items: [
        { id: "fingerprints", label: t("sidebar.navFingerprints"), svg: <NavFingerprintsIcon className="size-5" /> },
        { id: "extensions", label: t("sidebar.navExtensions"), svg: <NavExtensionsIcon className="size-5" /> },
        { id: "bookmarks", label: t("sidebar.navBookmarks"), svg: <NavBookmarksIcon className="size-5" /> },
      ],
    },
    {
      label: t("sidebar.groupSystem"),
      items: [
        { id: "trash", label: t("sidebar.navTrash"), svg: <NavTrashIcon className="size-5" /> },
        { id: "patchlog", label: t("sidebar.navPatchLog"), svg: <NavPatchLogIcon className="size-5" /> },
        { id: "settings", label: t("sidebar.navSettings"), svg: <NavSettingsIcon className="size-5" /> },
      ],
    },
  ];

  // Automation/MCP quick widget (fills the sidebar's lower space).
  const [autoUrl, setAutoUrl] = useState("");
  useEffect(() => {
    invoke<{ base_url: string; enabled: boolean }>("api_info")
      .then((i) => setAutoUrl(i.enabled ? i.base_url : ""))
      .catch(() => {});
  }, []);

  return (
    <aside className="flex flex-col border-r border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] py-3.5 pl-4 pr-3.5 select-none">
      <div className="flex items-center gap-2.5 px-2 pb-5 pt-1.5 select-none">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 text-white shadow-sm shadow-indigo-600/25 ring-1 ring-white/20">
          <ShardLogo className="w-5 h-[18px]" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[15.5px] font-bold tracking-tight text-zinc-900 dark:text-white leading-none">ShardX</span>
            <span className="rounded-[5px] bg-indigo-500/10 dark:bg-indigo-500/20 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 leading-none">v2</span>
          </div>
          <span className="mt-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 leading-none">Launcher</span>
        </div>
      </div>
      <nav className="flex flex-col gap-4">
        {sections.map((sec) => (
          <div key={sec.label} className="flex flex-col gap-1">
            <div className="px-3 pb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-mid-gray,#737373)]">{sec.label}</div>
            {sec.items.map((it) => {
              const active = section === it.id;
              return (
                <button
                  key={it.id}
                  className={cn(
                    "relative flex cursor-pointer items-center gap-3 rounded-[18px] px-3.5 py-2.5 text-left text-[13.5px] transition-all",
                    active
                      ? "bg-[var(--color-paper,#ffffff)] font-medium text-[var(--color-ink,#0a0a0a)] border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)]"
                      : "bg-transparent text-[var(--color-mid-gray,#737373)] hover:bg-[var(--color-canvas,#f5f5f5)] hover:text-[var(--color-ink,#0a0a0a)] border border-transparent",
                  )}
                  onClick={() => setSection(it.id)}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className={cn(
                      "grid size-5 place-items-center transition-colors",
                      active ? "text-indigo-600 dark:text-indigo-400" : "text-[var(--color-mid-gray,#737373)]",
                    )}
                  >
                    {it.svg}
                  </span>
                  <span>{it.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="mt-auto border-t border-[var(--color-hairline,#e5e5e5)] pt-3">
        <div className="mb-2.5 flex flex-col gap-2 rounded-[18px] bg-[var(--color-paper,#ffffff)] p-3 border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--color-mid-gray,#737373)]">{t("sidebar.apiTitle")}</span>
            {autoUrl && <Badge color="success" variant="light" size="small" dot>{t("sidebar.apiOn")}</Badge>}
          </div>
          {autoUrl ? (
            <button
              className="flex w-full cursor-pointer items-center justify-between gap-1.5 rounded-[18px] bg-[var(--color-canvas,#f5f5f5)] px-2.5 py-1.5 text-paragraph-xs text-[var(--color-ink,#0a0a0a)] border border-[var(--color-hairline,#e5e5e5)] transition-colors hover:bg-[var(--color-paper,#ffffff)]"
              title={t("sidebar.copyApiUrl")}
              onClick={() => { clip.write(autoUrl); toast.ok(t("sidebar.apiUrlCopied")); }}
            >
              <span className="mono truncate text-[12px]">{autoUrl.replace(/^https?:\/\//, "")}</span>
              <CopyIcon className="size-3.5 shrink-0 text-[var(--color-mid-gray,#737373)]" />
            </button>
          ) : (
            <div className="text-paragraph-xs text-[var(--color-mid-gray,#737373)]">{t("sidebar.apiOff")}</div>
          )}
          <DownloadMcp />
          <Button
            variant="neutral"
            mode="ghost"
            size="xsmall"
            className="w-full rounded-[18px] text-[var(--color-ink,#0a0a0a)] hover:bg-[var(--color-canvas,#f5f5f5)]"
            leftIcon={<DocsIcon className="size-4" />}
            onClick={() => {
              openUrl(withUtm("https://docs.proxyshard.com/eng/shardx-launcher-api/binding-and-lifecycle?fallback=true")).catch(() => {});
            }}
            title={t("sidebar.docsTitle")}
          >
            {t("sidebar.docs")}
          </Button>
        </div>
        <ThemeSwitch />
        <VersionPill />
      </div>
    </aside>
  );
}
