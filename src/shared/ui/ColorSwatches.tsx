import { cn } from "@proxyshard/shardx-ui-kit";
import { useT } from "../i18n";

/** Profile accent: the window icon and the omnibox pill. "" = derive from the
 *  name, which is what the browser does on its own. */
export const PROFILE_COLORS = [
  "#2FCB80", "#12B76A", "#0BA5EC", "#3B82F6", "#724FFF", "#9E5BFF",
  "#E040C8", "#EC4899", "#F04438", "#F97316", "#EAB308", "#84CC16",
];

export function ColorSwatches({
  value, onChange, label,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const t = useT();
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-label-sm font-medium text-zinc-900 dark:text-white">{label}</span>}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          title={t("colorSwatches.autoTitle")}
          onClick={() => onChange("")}
          className={cn(
            "grid size-6 place-items-center rounded-full text-[9px] font-bold text-zinc-600 dark:text-zinc-300 ring-1 ring-inset transition-[box-shadow]",
            value === ""
              ? "ring-2 ring-indigo-500"
              : "ring-[var(--color-hairline,#e5e5e5)] hover:ring-zinc-400 dark:hover:ring-zinc-600",
          )}
        >
          A
        </button>
        {PROFILE_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => onChange(c)}
            style={{ background: c }}
            className={cn(
              "size-6 rounded-full transition-[box-shadow]",
              value.toLowerCase() === c.toLowerCase()
                ? "ring-2 ring-zinc-900 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-zinc-900"
                : "ring-1 ring-inset ring-black/10 hover:ring-black/25",
            )}
          />
        ))}
      </div>
    </div>
  );
}
