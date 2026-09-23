import { useEffect, useMemo, useState } from "react";
import { Checkbox, Pagination } from "@proxyshard/shardx-ui-kit";
import { useContextMenu } from "../../shared/hooks/useContextMenu";
import { useT } from "../../shared/i18n";
import { useProxy, useFilteredProxies, useProfileCountByProxy } from "../../entities/proxy";
import { NewProxyButton } from "../../features/manage-proxies";
import { NavProxiesIcon } from "../../shared/icons";
import { ProxyRow } from "./ProxyRow";

const PROXY_PAGE_SIZE = 20;

export function ProxyTable() {
  const t = useT();
  const totalProxies = useProxy((s) => s.proxies.length);
  const selectProxy = useProxy((s) => s.selectProxy);
  const proxySel = useProxy((s) => s.proxySel);
  const search = useProxy((s) => s.search);

  const filteredProxies = useFilteredProxies();
  const profileCountByProxy = useProfileCountByProxy();
  const ctx = useContextMenu();

  const [proxyPage, setProxyPage] = useState(1);
  const proxyPageCount = Math.max(1, Math.ceil(filteredProxies.length / PROXY_PAGE_SIZE));
  useEffect(() => {
    if (proxyPage > proxyPageCount) setProxyPage(proxyPageCount);
  }, [proxyPageCount, proxyPage]);
  // Reset to page 1 when the search narrows the list to fewer pages.
  useEffect(() => { setProxyPage(1); }, [search]);
  const pagedProxies = useMemo(
    () => filteredProxies.slice((proxyPage - 1) * PROXY_PAGE_SIZE, proxyPage * PROXY_PAGE_SIZE),
    [filteredProxies, proxyPage],
  );

  const allPageSelected = pagedProxies.length > 0 && pagedProxies.every((p) => proxySel.has(p.id));
  const anyPageSelected = pagedProxies.some((p) => proxySel.has(p.id));

  return (
    <>
      <div className="overflow-hidden rounded-[24px] bg-[var(--color-paper,#ffffff)] border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)]">
        <div className="p-cols w-full justify-between border-b border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-300">
          <div>
            <Checkbox
              title={t("proxyTable.selectAllOnPage")}
              checked={allPageSelected}
              indeterminate={anyPageSelected && !allPageSelected}
              onChange={(e) => selectProxy(e.target.checked, pagedProxies)}
            />
          </div>
          <div>{t("proxyTable.colName")}</div>
          <div>{t("proxyTable.colType")}</div>
          <div>{t("proxyTable.colHostPort")}</div>
          <div>{t("proxyTable.colCountry")}</div>
          <div>{t("proxyTable.colProfiles")}</div>
          <div>{t("proxyTable.colTestResult")}</div>
          <div></div>
        </div>
        {pagedProxies.map((p) => (
          <ProxyRow
            key={p.id}
            proxy={p}
            profileCount={profileCountByProxy[p.id] ?? 0}
            onMenu={ctx.open}
          />
        ))}
        {totalProxies === 0 && (
          <div className="flex flex-col items-center gap-2.5 px-6 py-14 text-center">
            <div className="mb-2 grid size-14 place-items-center rounded-[18px] bg-sky-500/10 text-sky-500 border border-sky-500/25">
              <NavProxiesIcon className="size-7" />
            </div>
            <h3 className="m-0 text-label-sm font-semibold text-zinc-900 dark:text-white">{t("proxyTable.emptyTitle")}</h3>
            <p className="m-0 max-w-[420px] text-paragraph-sm text-zinc-500 dark:text-zinc-400">
              {t("proxyTable.emptyHint")}
            </p>
            <div className="mt-2 flex gap-2">
              <NewProxyButton />
            </div>
          </div>
        )}
      </div>
      {proxyPageCount > 1 && (
        <div className="flex items-center justify-center py-3 pb-1">
          <Pagination
            page={proxyPage}
            totalPages={proxyPageCount}
            asLinks={false}
            onPageChange={setProxyPage}
            infoLabel={(p, total) => t("proxyTable.pageInfo", { page: p, total, count: totalProxies })}
          />
        </div>
      )}
      {ctx.node}
    </>
  );
}
