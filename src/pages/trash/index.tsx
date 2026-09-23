import { useEffect } from "react";
import { Button } from "@proxyshard/shardx-ui-kit";
import { Topbar } from "../../shared/ui/Topbar";
import { useStoreChanged } from "../../shared/hooks/useStoreChanged";
import Badge from "../../shared/ui/Badge";
import { DeleteIcon, NavTrashIcon, RestoreIcon } from "../../shared/icons";
import { daysUntil, fmtBytes, fmtTs } from "../../shared/lib/utils";
import { useTrash } from "../../entities/trash";
import { useT } from "../../shared/i18n";

export function TrashPage() {
  const t = useT();
  const init = useTrash((s) => s.init);
  const items = useTrash((s) => s.items);
  const busy = useTrash((s) => s.busy);
  const restore = useTrash((s) => s.restore);
  const purge = useTrash((s) => s.purge);
  const empty = useTrash((s) => s.empty);

  const reload = useTrash((s) => s.reload);
  useEffect(() => { init(); }, [init]);
  // A profile deleted or restored through the API belongs in this list.
  useStoreChanged(reload);

  return (
    <section className="flex flex-col">
      <Topbar crumbs={[t("trash.crumbSystem"), t("trash.crumbTrash")]} search="" onSearch={() => {}} />

      <div className="mb-3.5 flex items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-page-title text-zinc-900 dark:text-white">{t("trash.title")}</h1>
          <p className="m-0 mt-1 max-w-[70ch] text-paragraph-xs text-zinc-500 dark:text-zinc-400">
            {t("trash.intro")}
          </p>
        </div>
        {items.length > 0 && (
          <Button
            variant="error" mode="stroke" size="small"
            leftIcon={<DeleteIcon className="size-4" />}
            onClick={empty}
          >
            {t("trash.emptyTrash")}
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-[24px] bg-[var(--color-paper,#ffffff)] border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)]">
        {items.length > 0 && (
          <div className="grid grid-cols-[1fr_120px_150px_120px_190px] items-center gap-3 border-b border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] px-5 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-300">
            <div>{t("trash.colName")}</div>
            <div>{t("trash.colFolder")}</div>
            <div>{t("trash.colDeleted")}</div>
            <div>{t("trash.colSize")}</div>
            <div />
          </div>
        )}
        {items.map((e) => {
          const left = daysUntil(e.expires_at);
          return (
            <div
              key={e.id}
              className="grid grid-cols-[1fr_120px_150px_120px_190px] items-center gap-3 border-t border-[var(--color-hairline,#e5e5e5)] px-5 py-3 first:border-t-0 transition-colors hover:bg-[var(--color-surface-alt,#fafafa)]"
            >
              <div className="min-w-0">
                <div className="truncate text-label-xs font-semibold text-zinc-900 dark:text-white">{e.name}</div>
                <div className="font-mono truncate text-[11px] text-zinc-500 dark:text-zinc-400">{e.id.slice(0, 8)}</div>
              </div>
              <div className="truncate text-paragraph-xs font-medium text-zinc-700 dark:text-zinc-300">
                {e.folder || <span className="font-mono text-zinc-400 dark:text-zinc-500">-</span>}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-paragraph-xs text-zinc-500 dark:text-zinc-400">{fmtTs(`@${e.deleted_at}`)}</span>
                <Badge color={left <= 1 ? "error" : "gray"} variant="filled" size="small">
                  {left === 0 ? t("trash.expiresToday") : t("trash.daysLeft", { n: left })}
                </Badge>
              </div>
              <div className="font-mono text-paragraph-xs font-semibold text-zinc-700 dark:text-zinc-200">{fmtBytes(e.size_bytes)}</div>
              <div className="flex justify-end gap-1.5">
                <Button
                  variant="neutral" mode="stroke" size="xsmall"
                  disabled={busy === e.id} isLoading={busy === e.id}
                  leftIcon={<RestoreIcon className="size-4" />}
                  onClick={() => restore(e)}
                >
                  {t("trash.restore")}
                </Button>
                <Button
                  variant="error" mode="stroke" size="xsmall"
                  className="hover:!bg-rose-500/10"
                  leftIcon={<DeleteIcon className="size-4 text-rose-500" />}
                  onClick={() => purge(e)}
                >
                  {t("trash.delete")}
                </Button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="flex flex-col items-center gap-2.5 px-6 py-14 text-center">
            <div className="mb-2 grid size-14 place-items-center rounded-[18px] bg-rose-500/10 text-rose-500 border border-rose-500/25">
              <NavTrashIcon className="size-7" />
            </div>
            <h3 className="m-0 text-label-sm font-semibold text-zinc-900 dark:text-white">{t("trash.emptyTitle")}</h3>
            <p className="m-0 max-w-[420px] text-paragraph-sm text-zinc-500 dark:text-zinc-400">
              {t("trash.emptyHint")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
