import { CountryFlag } from "../../../shared/ui/CountryFlag";
import type { ProxyTestSnapshot } from "../model/types";

export function ProxyCountryCell({ snap, fallback }: { snap?: ProxyTestSnapshot; fallback: string }) {
  const cc = snap?.country_code || fallback || "";
  if (!cc) return <span className="text-paragraph-xs font-mono text-zinc-400 dark:text-zinc-500">-</span>;
  return (
    <span className="wrap-anywhere inline-flex min-w-0 flex-wrap items-center gap-1.5 gap-y-[2px]">
      <CountryFlag cc={cc} />
      <span className="inline-block rounded-[6px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[11px] font-mono font-bold tracking-[0.5px] text-zinc-700 dark:text-zinc-200">{cc}</span>
      {snap?.city && <span className="text-paragraph-xs font-medium text-zinc-500 dark:text-zinc-400">{snap.city}</span>}
    </span>
  );
}
