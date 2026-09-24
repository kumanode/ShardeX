import { SearchIcon } from "../icons";
import { useT } from "../i18n";

export function Topbar({ crumbs, search, onSearch }: { crumbs: string[]; search: string; onSearch: (v: string) => void }) {
  const t = useT();
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 text-[13px] font-normal text-[var(--color-mid-gray,#737373)]">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={c} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[var(--color-hairline,#d4d4d4)] select-none">/</span>}
              <span className={isLast ? "font-medium text-[var(--color-ink,#0a0a0a)]" : "text-[var(--color-mid-gray,#737373)]"}>
                {c}
              </span>
            </span>
          );
        })}
      </div>
      <div className="w-full sm:w-[280px] md:w-[300px]">
        <div className="group relative flex items-center">
          <span className="pointer-events-none absolute left-3 grid place-items-center text-[var(--color-mid-gray,#737373)] transition-colors group-focus-within:text-[var(--color-ink,#0a0a0a)] dark:group-focus-within:text-white">
            <SearchIcon className="size-4" />
          </span>
          <input
            type="text"
            className="h-9 w-full rounded-[18px] border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)] pl-9 pr-3 text-[13px] text-[var(--color-ink,#0a0a0a)] placeholder-[var(--color-mid-gray,#737373)] shadow-[var(--shadow-subtle)] outline-none transition-all focus:border-[var(--color-ink,#0a0a0a)] focus:ring-2 focus:ring-[var(--color-ink,#0a0a0a)]/10 dark:focus:border-white dark:focus:ring-white/10"
            placeholder={t("topbar.searchPlaceholder")}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
