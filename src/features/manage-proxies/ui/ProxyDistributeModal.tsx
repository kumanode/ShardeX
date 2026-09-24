import { useEffect, useMemo, useState } from "react";
import { Checkbox, DialogModal, SegmentControl, cn } from "@proxyshard/shardx-ui-kit";
import { CSSelect } from "../../../shared/ui/CSSelect";
import { useT } from "../../../shared/i18n";
import { useProxy } from "../../../entities/proxy";

/** Spreads the selected proxies over the chosen profiles, paired by position —
 *  which is why both lists are shown rather than just their counts. */
export function ProxyDistributeModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const proxies = useProxy((s) => s.proxies);
  const proxySel = useProxy((s) => s.proxySel);
  const profiles = useProxy((s) => s.profiles);
  const distribute = useProxy((s) => s.distribute);

  const picked = useMemo(
    () => proxies.filter((p) => proxySel.has(p.id)),
    [proxies, proxySel],
  );

  const folders = useMemo(() => {
    const set = new Set<string>();
    for (const p of profiles) if (p.folder) set.add(p.folder);
    return [...set].sort();
  }, [profiles]);

  const [folder, setFolder] = useState("all");
  // Unbound profiles by default: distributing proxies over profiles that
  // already have one is how two of them end up behind the same IP without
  // anyone meaning it. "All profiles" is there for a deliberate re-shuffle.
  const [scope, setScope] = useState<"unbound" | "all">("unbound");
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const candidates = useMemo(
    () =>
      profiles.filter(
        (p) =>
          (folder === "all" || p.folder === folder) &&
          (scope === "all" || !p.proxy_id),
      ),
    [profiles, folder, scope],
  );

  // The list is what the filters say; re-pick everything whenever they change
  // rather than leaving a selection the operator can no longer see.
  useEffect(() => {
    setChosen(new Set(candidates.map((p) => p.id)));
  }, [candidates]);

  const targets = candidates.filter((p) => chosen.has(p.id));
  const boundCount = targets.filter((p) => p.proxy_id).length;
  const willBind = Math.min(targets.length, picked.length);

  const run = async () => {
    setBusy(true);
    try { await distribute(targets.map((p) => p.id)); onClose(); }
    finally { setBusy(false); }
  };

  return (
    <DialogModal
      open
      onClose={onClose}
      title={
        picked.length === 1
          ? t("proxyDistributeModal.titleOne")
          : t("proxyDistributeModal.titleMany", { n: picked.length })
      }
      maxWidthClassName="max-w-[760px]"
      confirmLabel={
        willBind === 0
          ? t("proxyDistributeModal.nothingToBind")
          : t("proxyDistributeModal.bindCount", { n: willBind })
      }
      onConfirm={run}
      isLoading={busy}
      isDisabled={busy || willBind === 0}
      cancelLabel={t("proxyDistributeModal.cancel")}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-3.5 py-1">
        <div className="grid grid-cols-2 gap-3">
          <CSSelect
            title={t("proxyDistributeModal.profilesFrom")}
            value={folder}
            onChange={setFolder}
            isSearchable={folders.length > 8}
            options={[
              { value: "all", label: t("proxyDistributeModal.everyFolder") },
              ...folders.map((f) => ({ value: f, label: f })),
            ]}
          />
          <label className="flex flex-col gap-1">
            <span className="text-label-sm font-medium text-zinc-900 dark:text-white">{t("proxyDistributeModal.applyTo")}</span>
            <SegmentControl
              size="small"
              className="w-full *:flex-1"
              value={scope}
              items={[
                { value: "unbound", label: t("proxyDistributeModal.scopeUnbound") },
                { value: "all", label: t("proxyDistributeModal.scopeAll") },
              ]}
              onChange={(v) => setScope(v as "unbound" | "all")}
            />
          </label>
        </div>

        {scope === "all" && boundCount > 0 && (
          <p className="m-0 rounded-[14px] bg-amber-500/10 px-3 py-2 text-paragraph-xs text-amber-700 dark:text-amber-300 border border-amber-500/25">
            {boundCount === 1
              ? t("proxyDistributeModal.replaceWarnOne")
              : t("proxyDistributeModal.replaceWarnMany", { n: boundCount })}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400">
              {t("proxyDistributeModal.proxiesCount", { n: picked.length })}
            </span>
            <div className="max-h-[240px] overflow-auto rounded-[18px] border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)]">
              {picked.map((p, i) => (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center gap-2 border-t border-[var(--color-hairline,#e5e5e5)] px-2.5 py-1.5 first:border-t-0",
                    i >= targets.length && "opacity-40",
                  )}
                >
                  <span className="mono w-5 shrink-0 text-[10.5px] text-zinc-400 dark:text-zinc-500">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-paragraph-xs text-zinc-600 dark:text-zinc-300">
                    {p.name || `${p.host}:${p.port}`}
                  </span>
                  {p.country && (
                    <span className="shrink-0 text-[10.5px] font-bold tracking-[0.5px] text-zinc-400 dark:text-zinc-500">
                      {p.country}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400">
              {t("proxyDistributeModal.profilesCount", {
                n: targets.length,
                total: candidates.length,
              })}
            </span>
            <div className="max-h-[240px] overflow-auto rounded-[18px] border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)]">
              {candidates.map((p, i) => {
                const on = chosen.has(p.id);
                const beyond = on && i >= picked.length;
                return (
                  <label
                    key={p.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 border-t border-[var(--color-hairline,#e5e5e5)] px-2.5 py-1.5 first:border-t-0 hover:bg-[var(--color-surface-alt,#fafafa)]",
                      beyond && "opacity-40",
                    )}
                  >
                    <Checkbox
                      checked={on}
                      onChange={() => {
                        const next = new Set(chosen);
                        if (on) next.delete(p.id); else next.add(p.id);
                        setChosen(next);
                      }}
                    />
                    <span className="mono w-5 shrink-0 text-[10.5px] text-zinc-400 dark:text-zinc-500">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-paragraph-xs text-zinc-600 dark:text-zinc-300">
                      {p.name}
                    </span>
                  </label>
                );
              })}
              {candidates.length === 0 && (
                <div className="px-2.5 py-4 text-center text-paragraph-xs text-zinc-500 dark:text-zinc-400">
                  {t("proxyDistributeModal.noMatches")}
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="m-0 text-paragraph-xs text-zinc-500 dark:text-zinc-400">
          {t("proxyDistributeModal.pairingNote")}
        </p>
      </div>
    </DialogModal>
  );
}
