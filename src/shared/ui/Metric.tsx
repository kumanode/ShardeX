import type { ReactNode } from "react";
import { cn } from "@proxyshard/shardx-ui-kit";

export type MetricColor = "indigo" | "emerald" | "sky" | "amber" | "purple" | "neutral";

/**
 * Stat Block matching DESIGN.md:
 * Achromatic container, 24px radius, 1px hairline border, subtle elevation,
 * 12px uppercase #737373 label, 36px Geist weight 600 #0a0a0a value with tight tracking.
 * Responsive font sizes for window flexibility.
 */
export function Metric({
  label,
  value,
  pulse,
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  pulse?: boolean;
  color?: MetricColor;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-[24px] bg-[var(--color-paper,#ffffff)] p-5 border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)] transition-all hover:border-[var(--color-ink,#0a0a0a)]/20 hover:shadow-sm min-w-0",
      )}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="truncate font-mono text-[11.5px] font-medium uppercase tracking-[0.06em] text-[var(--color-mid-gray,#737373)]">
          {label}
        </div>
        {pulse ? (
          <span className="flex items-center gap-1.5 rounded-[18px] bg-[var(--color-surface-alt,#fafafa)] px-2.5 py-0.5 text-[11px] font-mono font-medium text-[var(--color-ink,#0a0a0a)] border border-[var(--color-hairline,#e5e5e5)] shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            live
          </span>
        ) : icon ? (
          <div
            className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[var(--color-surface-alt,#fafafa)] text-[var(--color-ink,#0a0a0a)] dark:text-zinc-200 border border-[var(--color-hairline,#e5e5e5)] transition-transform group-hover:scale-105"
          >
            {icon}
          </div>
        ) : null}
      </div>
      <div className="mt-3 text-2xl sm:text-3xl md:text-[34px] font-semibold leading-none tracking-[-0.025em] text-[var(--color-ink,#0a0a0a)] dark:text-white tabular-nums truncate">
        {value}
      </div>
    </div>
  );
}
