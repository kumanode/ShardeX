import type { ReactNode } from "react";
import Badge from "../../../shared/ui/Badge";
import type { FingerprintEntry } from "../model/types";
import { useGpuCompat, useGpuCompatReady } from "../../../shared/model/gpuCompat";
import { IncompatibleBadge } from "../../../features/gpu-compat";

export function FingerprintCard({ entry, actions }: { entry: FingerprintEntry; actions?: ReactNode }) {
  // undefined while the GPU probe has not answered yet, and on machines where
  // it cannot run at all. Both are "no verdict", and no verdict must not look
  // like a clean one — hence the badge renders only on a definite mismatch.
  useGpuCompatReady();
  const compat = useGpuCompat((s) => s.byId[entry.id]);
  return (
    <div
      className="relative flex flex-col gap-2 rounded-[18px] border-l-[4px] bg-[var(--color-paper,#ffffff)] px-4 py-3.5 border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)] transition-all hover:bg-[var(--color-surface-alt,#fafafa)] hover:shadow-md"
      style={{ borderLeftColor: entry.tag_color ?? "#6366f1" }}
    >
      <div className="flex items-baseline justify-between gap-2.5">
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-label-xs font-semibold leading-[1.25] text-zinc-900 dark:text-white">{entry.label}</span>
        <span className="flex flex-none items-center gap-1.5">
          {compat && <IncompatibleBadge compat={compat} />}
          {entry.chrome && <Badge color="gray" variant="filled" size="small" className="flex-none">Chrome {entry.chrome}</Badge>}
        </span>
      </div>
      <div className="font-mono overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-zinc-600 dark:text-zinc-300 font-medium" title={entry.gpu}>{entry.gpu || "-"}</div>
      {actions && (
        <div className="mt-1 flex items-center gap-1.5 border-t border-[var(--color-hairline,#e5e5e5)] pt-2.5">
          {actions}
        </div>
      )}
    </div>
  );
}
