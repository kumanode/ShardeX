import { useEffect, useState } from "react";
import { automationFleet, type RunState, type WorkerState } from "../../entities/automation";
import { useT } from "../../shared/i18n";

const TONE: Record<WorkerState["status"], string> = {
  queued: "text-zinc-400 dark:text-zinc-500",
  starting: "text-amber-500 dark:text-amber-400",
  running: "text-emerald-600 dark:text-emerald-400",
  done: "text-zinc-500 dark:text-zinc-400",
  failed: "text-red-600 dark:text-red-400",
  stopped: "text-zinc-400 dark:text-zinc-500",
};

/** A second window: every browser in every run, one row each. */
export function FleetMonitor() {
  const t = useT();
  const [runs, setRuns] = useState<RunState[]>([]);

  useEffect(() => {
    let alive = true;
    const tick = () => {
      automationFleet()
        .then((r) => { if (alive) setRuns(r); })
        .catch(() => {});
    };
    tick();
    const t = setInterval(tick, 700);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const busy = runs.filter((r) => r.running);

  return (
    <div className="flex h-screen flex-col gap-2 bg-[var(--color-paper,#ffffff)] p-3">
      <div className="text-[13px] font-semibold text-zinc-900 dark:text-white">
        Fleet {busy.length > 0 && <span className="text-zinc-500 dark:text-zinc-400">· {busy.length} running</span>}
      </div>

      {runs.length === 0 ? (
        <p className="m-0 mt-6 text-center text-paragraph-sm text-zinc-500 dark:text-zinc-400">
          {t("fleetMonitor.emptyState")}
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          {runs.map((r) => (
            <div key={r.project_id} className="rounded-[16px] border border-[var(--color-hairline,#e5e5e5)]">
              <div className="flex items-center justify-between border-b border-[var(--color-hairline,#e5e5e5)] px-2.5 py-1.5">
                <span className="truncate text-[12px] font-semibold text-zinc-900 dark:text-white">{r.project_name}</span>
                <span className="text-paragraph-xs text-zinc-500 dark:text-zinc-400">
                  {r.running ? "running" : "finished"}
                </span>
              </div>
              {r.workers.map((w) => (
                <div
                  key={w.profile_id}
                  className="grid grid-cols-[1fr_64px_76px] items-center gap-2 px-2.5 py-1.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-paragraph-xs text-zinc-800 dark:text-zinc-200">
                      {w.profile_name}
                    </div>
                    {w.note && (
                      <div className="truncate text-paragraph-xs text-zinc-500 dark:text-zinc-400">{w.note}</div>
                    )}
                  </div>
                  <div className="text-paragraph-xs text-zinc-500 dark:text-zinc-400">
                    {w.steps_total > 0 ? `${w.step}/${w.steps_total}` : "—"}
                  </div>
                  <div className={`text-right text-paragraph-xs ${TONE[w.status]}`}>
                    {w.status}
                    {w.pass > 0 && <span className="text-zinc-400 dark:text-zinc-500"> ·{w.pass}</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
