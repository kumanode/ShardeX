/// Generic coloured chip. The UI kit's `Badge` is now a fixed order-status
/// component, so the app keeps its own small chip for proxy types, counts,
/// connection state, etc. Styled with the kit's design tokens so it reads as
/// native to the system.
import type { HTMLAttributes } from "react";
import { cn } from "@proxyshard/shardx-ui-kit";

export type BadgeColor = "success" | "error" | "warning" | "primary" | "information" | "purple" | "gray";
export type BadgeVariant = "filled" | "light" | "lighter" | "stroke";
export type BadgeSize = "small" | "medium";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  color?: BadgeColor;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
};

const colorStyles: Record<BadgeColor, { bg: string; text: string; border: string; dot: string }> = {
  success: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/25 dark:border-emerald-500/30",
    dot: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]",
  },
  primary: {
    bg: "bg-[var(--color-canvas,#f5f5f5)] dark:bg-zinc-800",
    text: "text-[var(--color-ink,#0a0a0a)] dark:text-zinc-100 font-semibold",
    border: "border-[var(--color-hairline,#e5e5e5)] dark:border-zinc-700",
    dot: "bg-[var(--color-ink,#0a0a0a)] dark:bg-white",
  },
  warning: {
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/25 dark:border-amber-500/30",
    dot: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]",
  },
  information: {
    bg: "bg-sky-500/10 dark:bg-sky-500/15",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-500/25 dark:border-sky-500/30",
    dot: "bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.5)]",
  },
  purple: {
    bg: "bg-purple-500/10 dark:bg-purple-500/15",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/25 dark:border-purple-500/30",
    dot: "bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.5)]",
  },
  error: {
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/25 dark:border-rose-500/30",
    dot: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]",
  },
  gray: {
    bg: "bg-[var(--color-canvas,#f5f5f5)] dark:bg-[var(--color-paper,#161619)]",
    text: "text-[var(--color-mid-gray,#737373)] dark:text-[var(--color-mid-gray,#a1a1aa)]",
    border: "border-[var(--color-hairline,#e5e5e5)] dark:border-[var(--color-hairline,#27272a)]",
    dot: "bg-[var(--color-mid-gray,#737373)]",
  },
};

export default function Badge({
  color = "gray",
  variant = "light",
  size = "medium",
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  const theme = colorStyles[color] || colorStyles.gray;

  let variantCls = `${theme.bg} ${theme.text} border ${theme.border}`;
  if (variant === "filled") {
    if (color === "gray") {
      variantCls = "bg-[var(--color-ink,#0a0a0a)] text-[var(--color-paper,#ffffff)] border-transparent";
    } else {
      variantCls = `${theme.bg.replace('/10', '').replace('/15', '')} text-white border-transparent`;
    }
  } else if (variant === "stroke") {
    variantCls = `bg-transparent ${theme.text} border ${theme.border}`;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center text-center gap-1.5 rounded-[18px] font-medium whitespace-nowrap transition-colors",
        size === "small" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]",
        variantCls,
        className,
      )}
      {...rest}
    >
      {dot && (
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            theme.dot,
            color === "success" && "animate-pulse",
          )}
        />
      )}
      {children}
    </span>
  );
}
