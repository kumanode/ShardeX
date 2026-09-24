import { useEffect, useMemo, useState } from "react";
import { Checkbox, Pagination } from "@proxyshard/shardx-ui-kit";
import { SkeletonRows } from "../../shared/ui/Skeleton";
import { NavBrowsersIcon } from "../../shared/icons";
import { useT } from "../../shared/i18n";
import { useContextMenu } from "../../shared/hooks/useContextMenu";
import {
  useProfile,
  useVisibleProfiles,
  useProxyMap,
} from "../../entities/profile";
import {
  ProfileInlineEditor,
  FromTemplateButton,
  NewProfileButton,
} from "../../features/manage-profiles";
import { ProfileRow } from "./ProfileRow";

const PAGE_SIZE = 20;

export function ProfileTable() {
  const t = useT();
  const selected = useProfile((s) => s.selected);
  const selectProfiles = useProfile((s) => s.selectProfiles);
  const expanded = useProfile((s) => s.expanded);
  const folder = useProfile((s) => s.folder);
  const search = useProfile((s) => s.search);
  const running = useProfile((s) => s.running);
  const status = useProfile((s) => s.status);

  const visible = useVisibleProfiles();
  const proxyMap = useProxyMap();
  const ctx = useContextMenu();

  // Pagination of the (filtered) profile list.
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  // Reset to page 1 when the filter changes; clamp if the list shrank.
  useEffect(() => { setPage(1); }, [folder, search]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);
  const paged = useMemo(
    () => visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [visible, page],
  );

  // Re-render every second so the uptime label ticks without re-fetching the
  // process list (which polls every 2s in the store).
  const [, setUptimeTick] = useState(0);
  useEffect(() => {
    if (Object.keys(running).length === 0) return;
    const h = setInterval(() => setUptimeTick((t) => t + 1), 1000);
    return () => clearInterval(h);
  }, [running]);

  // Scroll the expanded editor into view after the expand animation.
  useEffect(() => {
    if (!expanded || expanded === "__new__") return;
    const t = setTimeout(() => {
      const el = document.querySelector<HTMLElement>(".row-wrap.row-expanded .inline-editor");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    return () => clearTimeout(t);
  }, [expanded]);

  const allPageSelected = paged.length > 0 && paged.every((p) => selected.has(p.id));
  const anyPageSelected = paged.some((p) => selected.has(p.id));

  return (
    <>
      <div className="overflow-hidden rounded-[24px] bg-[var(--color-paper,#ffffff)] border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)]">
        <div className="w-full overflow-x-auto min-w-0">
          <div className="min-w-[860px]">
            {/* Chrome voice: column headers are small-caps mono labels. */}
            <div className="t-cols border-b border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--color-mid-gray,#737373)]">
              <div></div>
              <div>
                <Checkbox
                  title={t("profileTable.selectAllOnPage")}
                  // Header checkbox toggles only visible page rows; other pages preserved.
                  checked={allPageSelected}
                  indeterminate={anyPageSelected && !allPageSelected}
                  onChange={(e) => selectProfiles(e.target.checked, paged)}
                />
              </div>
              <div>{t("profileTable.colName")}</div>
              <div>{t("profileTable.colStatus")}</div>
              <div>{t("profileTable.colProxy")}</div>
              <div>{t("profileTable.colNotes")}</div>
              <div>{t("profileTable.colTime")}</div>
              <div>{t("profileTable.colLastRun")}</div>
              <div></div>
            </div>
            {expanded === "__new__" && (
              <div className="row-expanded row-new relative border-t border-[var(--color-hairline,#e5e5e5)] first:border-t-0">
                <ProfileInlineEditor />
              </div>
            )}
            {status === "loading" && paged.length === 0 ? (
              <div className="p-4">
                <SkeletonRows rows={6} />
              </div>
            ) : (
              paged.map((p) => (
                <ProfileRow
                  key={p.id}
                  profile={p}
                  proxy={p.proxy_id ? proxyMap[p.proxy_id] ?? null : null}
                  onMenu={ctx.open}
                />
              ))
            )}
          </div>
        </div>
        {visible.length === 0 && !expanded && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="relative mb-2 flex size-14 items-center justify-center rounded-[18px] bg-[var(--color-surface-alt,#fafafa)] text-[var(--color-ink,#0a0a0a)] border border-[var(--color-hairline,#e5e5e5)] shadow-xs">
              <span className="scale-125"><NavBrowsersIcon className="size-6" /></span>
            </div>
            <h3 className="m-0 text-title-h6 font-semibold text-[var(--color-ink,#0a0a0a)]">{t("profileTable.emptyTitle")}</h3>
            <p className="m-0 max-w-[420px] text-paragraph-sm text-[var(--color-mid-gray,#737373)]">
              {t("profileTable.emptyHint")}
            </p>
            <div className="mt-2 flex gap-2">
              <FromTemplateButton />
              <NewProfileButton />
            </div>
          </div>
        )}
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-center py-3 pb-1">
          <Pagination
            page={page}
            totalPages={pageCount}
            asLinks={false}
            onPageChange={setPage}
            infoLabel={(p, total) => t("profileTable.pageInfo", { page: p, total, count: visible.length })}
          />
        </div>
      )}
      {ctx.node}
    </>
  );
}
