import { useEffect, useState, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button, cn } from "@proxyshard/shardx-ui-kit";
import Badge from "../../shared/ui/Badge";
import {
  NavBrowsersIcon,
  RouteIcon,
  NavFingerprintsIcon,
  NavSettingsIcon,
  NavPatchLogIcon,
  NavExtensionsIcon,
  NavBookmarksIcon,
  NavTrashIcon,
  NavAutomationIcon,
  NavCredentialsIcon,
  CopyIcon,
  DocsIcon,
  ShardLogo,
  ShardMini,
  SidebarToggleIcon,
} from "../../shared/icons";
import { clip } from "../../shared/lib/clipboard";
import { toast } from "../../shared/model/toast";
import { withUtm } from "../../shared/lib/utils";
import type { RtUpdate, Section } from "../../shared/types";
import { useNav } from "../../shared/model/navigation";
import { useT } from "../../shared/i18n";
import { DownloadMcp } from "../../features/DownloadMcp";
import { ThemeSwitch } from "../../features/ThemeSwitch";

function VersionPill({ compact }: { compact?: boolean }) {
  const t = useT();
  const [info, setInfo] = useState<RtUpdate | null>(null);
  useEffect(() => {
    invoke<RtUpdate>("launcher_update_check").then(setInfo).catch(() => {});
  }, []);
  const open = () => {
    if (info?.release_url) openUrl(info.release_url).catch(() => {});
  };
  const clickable = !!info?.release_url;

  const titleText = info?.update_available
    ? t("sidebar.updateTitle", { v: info.latest ?? "" })
    : info
      ? info.latest
        ? t("sidebar.runningWithRemote", { v: info.current, latest: info.latest })
        : t("sidebar.running", { v: info.current })
      : t("sidebar.checkingTitle");

  if (compact) {
    return (
      <button
        type="button"
        className={cn(
          "flex size-10 items-center justify-center rounded-[18px] border border-transparent bg-transparent text-[var(--color-ink,#0a0a0a)] dark:text-zinc-300 transition-colors",
          info?.update_available
            ? "cursor-pointer border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-canvas,#f5f5f5)] hover:border-[var(--color-ink,#0a0a0a)]"
            : "cursor-default hover:enabled:bg-[var(--color-canvas,#f5f5f5)] disabled:opacity-85",
        )}
        onClick={open}
        disabled={!clickable}
        title={titleText}
      >
        <span className="relative">
          <ShardMini className="size-4" />
          {info?.update_available && (
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-zinc-900" />
          )}
        </span>
      </button>
    );
  }

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
      title={titleText}
    >
      <span className="text-[var(--color-ink,#0a0a0a)] dark:text-zinc-300"><ShardMini /></span>
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
  const sidebarCollapsed = useNav((s) => s.sidebarCollapsed);
  const toggleSidebar = useNav((s) => s.toggleSidebar);

  const sections: { label: string; items: { id: Section; label: string; svg: ReactNode }[] }[] = [
    {
      label: t("sidebar.groupWorkspace"),
      items: [
        { id: "browsers", label: t("sidebar.navBrowsers"), svg: <NavBrowsersIcon className="size-5" /> },
        { id: "proxies", label: t("sidebar.navProxies"), svg: <RouteIcon className="size-5" /> },
        { id: "credentials", label: t("sidebar.navCredentials"), svg: <NavCredentialsIcon className="size-5" /> },
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
    <aside
      className={cn(
        "flex flex-col border-r border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] py-3.5 select-none transition-all duration-200 overflow-y-auto overflow-x-hidden",
        sidebarCollapsed ? "px-2 items-center" : "pl-4 pr-3.5"
      )}
    >
      {/* Header */}
      {sidebarCollapsed ? (
        <div className="flex flex-col items-center gap-2 pb-4 pt-1.5 select-none">
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-[var(--color-ink,#0a0a0a)] dark:bg-[var(--color-paper,#ffffff)] text-white dark:text-[var(--color-ink,#0a0a0a)] shadow-xs border border-[var(--color-hairline,#e5e5e5)] hover:opacity-90 transition-opacity cursor-pointer"
            title="Expand Sidebar"
          >
            <ShardLogo className="w-5 h-[18px]" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 px-2 pb-5 pt-1.5 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-[var(--color-ink,#0a0a0a)] dark:bg-[var(--color-paper,#ffffff)] text-white dark:text-[var(--color-ink,#0a0a0a)] shadow-xs border border-[var(--color-hairline,#e5e5e5)]">
              <ShardLogo className="w-5 h-[18px]" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[15.5px] font-bold tracking-tight text-zinc-900 dark:text-white leading-none">ShardeX</span>
                <span className="rounded-[6px] bg-[var(--color-canvas,#f5f5f5)] dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[var(--color-ink,#0a0a0a)] dark:text-zinc-200 border border-[var(--color-hairline,#e5e5e5)] dark:border-zinc-700 leading-none">v2</span>
              </div>
              <span className="mt-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 leading-none">Launcher</span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex size-7 shrink-0 items-center justify-center rounded-[10px] text-[var(--color-mid-gray,#737373)] hover:text-[var(--color-ink,#0a0a0a)] hover:bg-[var(--color-canvas,#f5f5f5)] transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <SidebarToggleIcon className="size-4" />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className={cn("flex flex-col", sidebarCollapsed ? "gap-2.5 items-center w-full" : "gap-4")}>
        {sections.map((sec) => (
          <div key={sec.label} className={cn("flex flex-col", sidebarCollapsed ? "gap-1 items-center w-full" : "gap-1")}>
            {!sidebarCollapsed && (
              <div className="px-3 pb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-mid-gray,#737373)]">
                {sec.label}
              </div>
            )}
            {sec.items.map((it) => {
              const active = section === it.id;
              if (sidebarCollapsed) {
                return (
                  <button
                    key={it.id}
                    className={cn(
                      "relative flex size-10 cursor-pointer items-center justify-center rounded-[18px] transition-all",
                      active
                        ? "bg-[var(--color-paper,#ffffff)] text-[var(--color-ink,#0a0a0a)] border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)]"
                        : "bg-transparent text-[var(--color-mid-gray,#737373)] hover:bg-[var(--color-canvas,#f5f5f5)] hover:text-[var(--color-ink,#0a0a0a)] border border-transparent",
                    )}
                    onClick={() => setSection(it.id)}
                    title={it.label}
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className={cn(
                        "grid size-5 place-items-center transition-colors",
                        active ? "text-[var(--color-ink,#0a0a0a)] dark:text-white" : "text-[var(--color-mid-gray,#737373)]",
                      )}
                    >
                      {it.svg}
                    </span>
                  </button>
                );
              }

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
                      active ? "text-[var(--color-ink,#0a0a0a)] dark:text-white" : "text-[var(--color-mid-gray,#737373)]",
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

      {/* Footer / Widgets */}
      <div className={cn("mt-auto border-t border-[var(--color-hairline,#e5e5e5)] pt-3", sidebarCollapsed ? "flex flex-col items-center w-full" : "")}>
        {!sidebarCollapsed ? (
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
        ) : null}
        <ThemeSwitch compact={sidebarCollapsed} />
        <VersionPill compact={sidebarCollapsed} />
      </div>
    </aside>
  );
}
