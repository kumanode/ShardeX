import { useEffect, useState } from "react";
import {
  helperFields, helperFill, helperClose, helperDismiss, type HelperField,
} from "../../entities/profile/model/api";
import { SyncIcon } from "../../shared/icons";
import { useT } from "../../shared/i18n";
import { dragWindowOnMouseDown } from "../../shared/lib/dragWindow";

/**
 * Shard Helper: offers to fill a form the browser noticed. It only ever offers —
 * nothing is typed until the button is pressed — and closes itself once the page
 * has nothing left to fill.
 */
export function HelperPanel({ profile }: { profile: string }) {
  const t = useT();
  const [fields, setFields] = useState<HelperField[]>([]);
  const [busy, setBusy] = useState(false);
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await helperFields(profile);
        if (!alive) return;
        const next = r?.fields ?? [];
        setFields(next);
        // Nothing left to fill — the page moved on, or the browser closed.
        if (next.length === 0) void helperClose();
      } catch { void helperClose(); }
    };
    void tick();
    const id = setInterval(tick, 1200);
    return () => { alive = false; clearInterval(id); };
  }, [profile]);

  /** What a kind is called to a person. */
  const LABELS: Record<string, string> = {
    first_name: t("helperPanel.firstName"), last_name: t("helperPanel.lastName"),
    full_name: t("helperPanel.fullName"),
    email: t("helperPanel.email"), username: t("helperPanel.username"),
    phone: t("helperPanel.phone"), country: t("helperPanel.country"), city: t("helperPanel.city"),
    postal_code: t("helperPanel.postcode"), street: t("helperPanel.address"),
    birth_day: t("helperPanel.birthDay"), birth_month: t("helperPanel.birthMonth"),
    birth_year: t("helperPanel.birthYear"),
    birth_date: t("helperPanel.birthDate"), gender: t("helperPanel.gender"),
  };

  const kinds = [...new Set(fields.map((f) => f.kind))];

  return (
    <div
      onMouseDown={dragWindowOnMouseDown}
      className="flex h-screen w-screen flex-col rounded-[20px] bg-[var(--color-paper,#ffffff)] border border-[var(--color-hairline,#e5e5e5)] shadow-xl overflow-hidden"
    >
      <div className="flex shrink-0 select-none items-center gap-2 px-3 pt-2.5 pb-1">
        <SyncIcon className="size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
        <div className="flex-1 truncate text-label-xs text-zinc-900 dark:text-white">
          {t("helperPanel.title")}
        </div>
        <button type="button" onMouseDown={(e) => e.stopPropagation()} onClick={() => void helperDismiss(profile)}
                title={t("helperPanel.dismiss")}
                className="rounded-[6px] px-1.5 text-paragraph-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-[var(--color-surface-alt,#fafafa)] transition-colors">
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-3 pb-1">
        {/* In a group each window fills with its own person. */}
        <div className="flex flex-wrap gap-1">
          {kinds.map((k) => (
            <span key={k}
                  className="rounded-[8px] px-2 py-0.5 text-paragraph-xs text-zinc-600 dark:text-zinc-300 border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)]">
              {LABELS[k] ?? k}
            </span>
          ))}
        </div>
      </div>

      <div className="shrink-0 px-3 pb-3 pt-1">
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          disabled={busy || fields.length === 0}
          onClick={async () => {
            setBusy(true);
            try { setFilled(await helperFill(profile)); } catch { /* shown by the next poll */ }
            setBusy(false);
          }}
          className="w-full rounded-[10px] bg-indigo-600 dark:bg-indigo-500 py-1.5 text-label-xs font-medium text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors"
        >
          {filled > 1
            ? t("helperPanel.filledWindows", { n: filled })
            : filled === 1
              ? t("helperPanel.fillAgain")
              : fields.length === 1
                ? t("helperPanel.fillOneField")
                : t("helperPanel.fillFields", { n: fields.length })}
        </button>
      </div>
    </div>
  );
}
