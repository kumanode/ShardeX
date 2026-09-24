import { useEffect } from "react";
import { cn } from "@proxyshard/shardx-ui-kit";
import { Topbar } from "../../shared/ui/Topbar";
import { useStoreChanged } from "../../shared/hooks/useStoreChanged";
import { useProxy } from "../../entities/proxy";
import { usePsAccount, usePsConnected } from "../../entities/proxyshard";
import { storeBus } from "../../shared/lib/storeBus";
import { ProxyEditor, ProxyBulkImporter, ProxyInfoPopover, ProxyDistributeModal } from "../../features/manage-proxies";
import { ProxyTable } from "../../widgets/ProxyTable/ProxyTable";
import { ProxyToolbar } from "../../widgets/ProxyTable/ProxyToolbar";
import { PsApiKeyCard } from "../../features/proxyshard";
import { PsAccountMetrics } from "../../widgets/ProxyShard/PsAccountMetrics";
import { PsToolbar } from "../../widgets/ProxyShard/PsToolbar";
import { PsManagementPanels } from "../../widgets/ProxyShard/PsManagementPanels";
import { useNav } from "../../shared/model/navigation";
import { useT } from "../../shared/i18n";
import { RouteIcon, NavShopIcon } from "../../shared/icons";

export function ProxiesPage() {
  const t = useT();
  const proxyTab = useNav((s) => s.proxyTab);
  const setProxyTab = useNav((s) => s.setProxyTab);

  // Entities state
  const initProxy = useProxy((s) => s.init);
  const reloadProxy = useProxy((s) => s.reload);
  const search = useProxy((s) => s.search);
  const setSearch = useProxy((s) => s.setSearch);
  const proxies = useProxy((s) => s.proxies);
  const editing = useProxy((s) => s.editing);
  const setEditing = useProxy((s) => s.setEditing);
  const bulkOpen = useProxy((s) => s.bulkOpen);
  const setBulkOpen = useProxy((s) => s.setBulkOpen);
  const infoFor = useProxy((s) => s.infoFor);
  const setInfoFor = useProxy((s) => s.setInfoFor);
  const snapshots = useProxy((s) => s.snapshots);
  const distributeOpen = useProxy((s) => s.distributeOpen);
  const setDistributeOpen = useProxy((s) => s.setDistributeOpen);

  // ProxyShard state
  const initPs = usePsAccount((s) => s.init);
  const psConnected = usePsConnected();

  useEffect(() => {
    initProxy();
    initPs();
  }, [initProxy, initPs]);

  // Pick up proxies/profiles added via the automation API or MCP live.
  useStoreChanged(reloadProxy);

  return (
    <section className="flex flex-col">
      <Topbar
        crumbs={[
          t("proxies.crumbWorkspace"),
          t("proxies.crumbProxies"),
          proxyTab === "proxyshard" ? t("proxies.tabProxyShard") : t("proxies.tabCustomProxies"),
        ]}
        search={proxyTab === "list" ? search : ""}
        onSearch={proxyTab === "list" ? setSearch : () => {}}
      />

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <h1 className="m-0 text-page-title text-zinc-900 dark:text-white">{t("proxies.title")}</h1>

        {/* Unified Sub-tabs Switcher */}
        <div className="flex items-center gap-1 rounded-[18px] bg-[var(--color-canvas,#f5f5f5)] p-1 border border-[var(--color-hairline,#e5e5e5)] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setProxyTab("list")}
            className={cn(
              "flex items-center gap-2 rounded-[14px] px-3.5 py-1.5 text-[13px] font-medium transition-all cursor-pointer",
              proxyTab === "list"
                ? "bg-[var(--color-paper,#ffffff)] text-[var(--color-ink,#0a0a0a)] shadow-xs border border-[var(--color-hairline,#e5e5e5)]"
                : "text-[var(--color-mid-gray,#737373)] hover:text-[var(--color-ink,#0a0a0a)] border border-transparent"
            )}
          >
            <RouteIcon className="size-4" />
            <span>{t("proxies.tabCustomProxies")}</span>
            <span className="rounded-[18px] bg-[var(--color-surface-alt,#fafafa)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-mid-gray,#737373)] border border-[var(--color-hairline,#e5e5e5)]">
              {proxies.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setProxyTab("proxyshard")}
            className={cn(
              "flex items-center gap-2 rounded-[14px] px-3.5 py-1.5 text-[13px] font-medium transition-all cursor-pointer",
              proxyTab === "proxyshard"
                ? "bg-[var(--color-paper,#ffffff)] text-[var(--color-ink,#0a0a0a)] shadow-xs border border-[var(--color-hairline,#e5e5e5)]"
                : "text-[var(--color-mid-gray,#737373)] hover:text-[var(--color-ink,#0a0a0a)] border border-transparent"
            )}
          >
            <NavShopIcon className="size-4" />
            <span>ProxyShard</span>
            {psConnected ? (
              <span className="size-2 rounded-full bg-emerald-500" title={t("psAccountMetrics.connected")} />
            ) : (
              <span className="size-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            )}
          </button>
        </div>
      </div>

      {proxyTab === "list" ? (
        <>
          <div className="mb-3.5 flex justify-end">
            <ProxyToolbar />
          </div>
          <ProxyTable />
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <PsAccountMetrics />
          <div className="flex items-center justify-between">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-mid-gray,#737373)]">
              ProxyShard
            </div>
            <PsToolbar />
          </div>
          <PsApiKeyCard />
          <PsManagementPanels />
        </div>
      )}

      {editing && (
        <ProxyEditor
          initial={editing}
          onClose={() => { setEditing(null); reloadProxy(); }}
          onSaved={() => storeBus.emit("proxies")}
        />
      )}
      {bulkOpen && (
        <ProxyBulkImporter
          onClose={() => { setBulkOpen(false); reloadProxy(); storeBus.emit("proxies"); }}
        />
      )}
      {distributeOpen && <ProxyDistributeModal onClose={() => setDistributeOpen(false)} />}
      {infoFor && (
        <ProxyInfoPopover
          proxy={infoFor.proxy}
          anchor={infoFor.anchor}
          latest={snapshots[infoFor.proxy.id]}
          onClose={() => setInfoFor(null)}
        />
      )}
    </section>
  );
}
