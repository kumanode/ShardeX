import type { Picked } from "../../entities/automation";
import { useT } from "../../shared/i18n";

export type MenuAction = { kind: string; label: string; needsText?: boolean };

/** What a right-click offers for the element under it. Ordered by how often an
 *  operator wants each. */
const actions = (t: (key: string) => string): MenuAction[] => [
  { kind: "click", label: t("actionMenu.click") },
  { kind: "type", label: t("actionMenu.type"), needsText: true },
  { kind: "doubleClick", label: t("actionMenu.doubleClick") },
  { kind: "rightClick", label: t("actionMenu.rightClick") },
  { kind: "hover", label: t("actionMenu.hover") },
  { kind: "clear", label: t("actionMenu.clear") },
  { kind: "waitFor", label: t("actionMenu.waitFor") },
  { kind: "ifExists", label: t("actionMenu.ifExists") },
  { kind: "readText", label: t("actionMenu.readText"), needsText: true },
];

type Props = {
  at: { x: number; y: number };
  target: Picked | null;
  onChoose: (a: MenuAction) => void;
  onClose: () => void;
};

export function ActionMenu({ at, target, onChoose, onClose }: Props) {
  const t = useT();
  const what = target?.label
    ? `"${target.label}"`
    : target?.tag
      ? `<${target.tag}>`
      : t("actionMenu.thisPoint");

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        className="fixed z-50 w-[220px] overflow-hidden rounded-[18px] bg-[var(--color-paper,#ffffff)] p-1.5 shadow-2xl border border-[var(--color-hairline,#e5e5e5)]"
        style={{ left: at.x, top: at.y }}
      >
        <div className="truncate px-2.5 py-1 text-paragraph-xs font-medium text-zinc-500 dark:text-zinc-400">
          {target?.selector ? what : t("actionMenu.byPosition", { what })}
        </div>
        {actions(t).map((a) => (
          <button
            key={a.kind}
            type="button"
            className="block w-full rounded-[10px] px-2.5 py-1.5 text-left text-paragraph-sm text-zinc-800 dark:text-zinc-200 hover:bg-[var(--color-surface-alt,#fafafa)] hover:text-zinc-900 dark:hover:text-white transition-colors"
            onClick={() => { onChoose(a); onClose(); }}
          >
            {a.label}
          </button>
        ))}
      </div>
    </>
  );
}
