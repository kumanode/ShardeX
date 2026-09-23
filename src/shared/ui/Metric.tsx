import type { ReactNode } from "react";
import { cn } from "@proxyshard/shardx-ui-kit";

export type MetricColor = "indigo" | "emerald" | "sky" | "amber" | "purple" | "neutral";

const colorStyles: Record<
  MetricColor,
  {
    stripe: string;
    iconBg: string;
    iconText: string;
    hoverBorder: string;
  }
> = {
  indigo: {
    stripe: "bg-gradient-to-r from-indigo-500 to-indigo-600",
    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/15",
    iconText: "text-indigo-600 dark:text-indigo-400",
    hoverBorder: "hover:border-indigo-500/30",
  },
  emerald: {
    stripe: "bg-gradient-to-r from-emerald-500 to-emerald-600",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    iconText: "text-emerald-600 dark:text-emerald-400",
    hoverBorder: "hover:border-emerald-500/30",
  },
  sky: {
    stripe: "bg-gradient-to-r from-sky-500 to-sky-600",
    iconBg: "bg-sky-500/10 dark:bg-sky-500/15",
    iconText: "text-sky-600 dark:text-sky-400",
    hoverBorder: "hover:border-sky-500/30",
  },
  amber: {
    stripe: "bg-gradient-to-r from-amber-500 to-amber-600",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/15",
    iconText: "text-amber-600 dark:text-amber-400",
    hoverBorder: "hover:border-amber-500/30",
  },
  purple: {
    stripe: "bg-gradient-to-r from-purple-500 to-purple-600",
    iconBg: "bg-purple-500/10 dark:bg-purple-500/15",
    iconText: "text-purple-600 dark:text-purple-400",
    hoverBorder: "hover:border-purple-500/30",
  },
  neutral: {
    stripe: "bg-gradient-to-r from-[var(--color-mid-gray,#737373)] to-[var(--color-ink,#0a0a0a)]",
    iconBg: "bg-[var(--color-canvas,#f5f5f5)]",
    iconText: "text-[var(--color-mid-gray,#737373)]",
    hoverBorder: "hover:border-[var(--color-ink,#0a0a0a)]/20",
  },
};

/// Stat card matching DESIGN.md with curated harmonic color accents
export function Metric({
  label,
  value,
  pulse,
  color = "neutral",
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  pulse?: boolean;
  color?: MetricColor;
  icon?: ReactNode;
}) {
  const theme = colorStyles[color] || colorStyles.neutral;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-[24px] bg-[var(--color-paper,#ffffff)] p-5 border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)] transition-all hover:shadow-md",
        theme.hoverBorder,
      )}
    >
      {/* Refined top accent stripe */}
      <div className={cn("absolute top-0 left-0 right-0 h-[3px] opacity-90", theme.stripe)} />

      <div className="flex items-center justify-between">
        <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-300">
          {label}
        </div>
        {pulse ? (
          <span className="flex items-center gap-1.5 rounded-[18px] bg-emerald-500/10 dark:bg-emerald-500/15 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            live
          </span>
        ) : icon ? (
          <div
            className={cn(
              "grid size-8 place-items-center rounded-[12px] transition-transform group-hover:scale-110",
              theme.iconBg,
              theme.iconText,
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      <div className="mt-3 text-[36px] font-bold leading-none tracking-[-0.03em] text-[var(--color-ink,#0a0a0a)] dark:text-white tabular-nums">
        {value}
      </div>
    </div>
  );
}
