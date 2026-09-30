import { useEffect, useState, memo } from "react";
import { cn } from "@proxyshard/shardx-ui-kit";
import { fmtUptime } from "../../shared/lib/utils";

interface LiveProfileUptimeProps {
  isRunning: boolean;
  runningSince?: number;
  totalRuntimeMs: number;
}

export const LiveProfileUptime = memo(function LiveProfileUptime({
  isRunning,
  runningSince,
  totalRuntimeMs,
}: LiveProfileUptimeProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isRunning || !runningSince) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, runningSince]);

  const live = isRunning && runningSince ? Date.now() - runningSince : 0;
  const total = totalRuntimeMs + live;

  return (
    <span
      className={cn(
        "text-paragraph-xs tabular-nums font-mono font-medium",
        isRunning ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-200"
      )}
    >
      {total > 0 ? fmtUptime(total) : "-"}
    </span>
  );
});
