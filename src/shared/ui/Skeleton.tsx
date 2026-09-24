import { cn } from "@proxyshard/shardx-ui-kit";

/// Shimmer placeholder for list/table loading states.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-[var(--color-surface-alt,#fafafa)] dark:bg-zinc-800/60", className)}
    />
  );
}

/// A row of skeleton cards — the usual shape while a list loads.
export function SkeletonRows({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  );
}
