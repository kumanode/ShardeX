import { useEffect, useMemo, useState } from "react";
import { Checkbox, Input, cn } from "@proxyshard/shardx-ui-kit";
import { ChevronDownIcon, CloseIcon } from "../../../shared/icons";
import { useExtensions, type ExtensionEntry } from "../../../entities/extension";
import { useNav } from "../../../shared/model/navigation";
import { useT } from "../../../shared/i18n";

function Icon({ e, className }: { e: ExtensionEntry; className?: string }) {
  return e.icon ? (
    <img src={e.icon} alt="" className={cn("shrink-0 rounded-[3px]", className)} />
  ) : (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-[3px] bg-[var(--color-surface-alt,#fafafa)] text-[9px] uppercase text-zinc-500 dark:text-zinc-400",
        className,
      )}
    >
      {e.name.slice(0, 1)}
    </span>
  );
}

/** Which extensions this profile loads. Expanded in place, not in a popover:
 *  the editor sits in a table row that clips an overlay. */
export function ExtensionPicker({
  value, onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const t = useT();
  const items = useExtensions((s) => s.items);
  const init = useExtensions((s) => s.init);
  const go = useNav((s) => s.setSection);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => { init(); }, [init]);

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  const picked = useMemo(
    () => value.map((id) => items.find((e) => e.id === id)).filter(Boolean) as ExtensionEntry[],
    [value, items],
  );
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (e) => e.name.toLowerCase().includes(needle) || e.description.toLowerCase().includes(needle),
    );
  }, [items, q]);

  if (items.length === 0) {
    return (
      <p className="m-0 text-paragraph-xs text-zinc-500 dark:text-zinc-400">
        {t("extensionPicker.emptyLibrary")}{" "}
        <button
          type="button"
          className="text-indigo-600 dark:text-indigo-400 hover:underline"
          onClick={() => go("extensions")}
        >
          {t("extensionPicker.addOne")}
        </button>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {picked.length > 0 && (
        <div className="flex max-h-[88px] flex-wrap gap-1.5 overflow-y-auto scrollbar">
          {picked.map((e) => (
            <span
              key={e.id}
              title={e.description || e.name}
              className="flex max-w-[13rem] items-center gap-1.5 rounded-[8px] bg-indigo-50 dark:bg-indigo-950/40 py-1 pl-1.5 pr-1 text-paragraph-xs text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50"
            >
              <Icon e={e} className="size-4" />
              <span className="truncate">{e.name}</span>
              <button
                type="button"
                title={t("extensionPicker.removeTitle")}
                onClick={() => toggle(e.id)}
                className="grid size-4 shrink-0 place-items-center rounded-[6px] text-indigo-500/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 hover:text-indigo-600 dark:hover:text-indigo-300"
              >
                <CloseIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-fit items-center gap-1.5 rounded-[12px] px-2.5 py-1.5 text-paragraph-xs text-zinc-600 dark:text-zinc-300 border border-[var(--color-hairline,#e5e5e5)] transition-colors hover:bg-[var(--color-surface-alt,#fafafa)]"
      >
        {picked.length > 0
          ? t("extensionPicker.changeCount", { n: picked.length, total: items.length })
          : t("extensionPicker.choose")}
        <ChevronDownIcon className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="flex flex-col gap-1.5 rounded-[16px] bg-[var(--color-paper,#ffffff)] p-1.5 border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)]">
          {items.length > 6 && (
            <Input
              inputSize="small"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("extensionPicker.searchPlaceholder")}
            />
          )}
          <div className="flex max-h-[176px] flex-col overflow-y-auto scrollbar">
            {shown.map((e) => (
              <label
                key={e.id}
                title={e.description || e.name}
                className="flex cursor-pointer items-center gap-2 rounded-[10px] px-1.5 py-1 hover:bg-[var(--color-surface-alt,#fafafa)]"
              >
                <Checkbox checked={value.includes(e.id)} onChange={() => toggle(e.id)} />
                <Icon e={e} className="size-4" />
                <span className="min-w-0 flex-1 truncate text-paragraph-xs text-zinc-700 dark:text-zinc-200">
                  {e.name}
                </span>
                {e.version && (
                  <span className="mono shrink-0 text-[10.5px] text-zinc-400 dark:text-zinc-500">
                    {e.version}
                  </span>
                )}
              </label>
            ))}
            {shown.length === 0 && (
              <div className="px-1.5 py-3 text-center text-paragraph-xs text-zinc-500 dark:text-zinc-400">
                {t("extensionPicker.noMatches")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
