import { useState } from "react";
import { Tag } from "@proxyshard/shardx-ui-kit";
import { useT } from "../i18n";

/// Editable list of ports rendered as removable UI-kit Tags.
export function PortList({
  label, value, onChange,
}: {
  label: string;
  value: number[];
  onChange: (v: number[]) => void;
}) {
  const t = useT();
  const [text, setText] = useState("");
  const commit = () => {
    // Accept "3389", "3389, 5900", "3389 5900"; drops non-numeric tokens.
    const toks = text.split(/[\s,]+/).filter(Boolean);
    if (toks.length === 0) return;
    const next = new Set(value);
    for (const t of toks) {
      const n = parseInt(t, 10);
      if (Number.isFinite(n) && n >= 1 && n <= 65535) next.add(n);
    }
    onChange([...next].sort((a, b) => a - b));
    setText("");
  };
  const remove = (p: number) => onChange(value.filter((x) => x !== p));
  return (
    <label className="flex flex-col gap-1">
      <span className="text-label-sm font-medium text-zinc-900 dark:text-white">{label}</span>
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-[12px] bg-[var(--color-paper,#ffffff)] px-2.5 py-1.5 border border-[var(--color-hairline,#e5e5e5)] transition focus-within:border-indigo-500">
        {value.map((p) => (
          <Tag key={p} variant="gray" onRemove={() => remove(p)}>
            <span className="mono text-[11.5px]">{p}</span>
          </Tag>
        ))}
        <input
          type="text"
          inputMode="numeric"
          className="min-w-[100px] flex-1 border-0 bg-transparent px-1 py-0.5 text-paragraph-xs text-zinc-900 dark:text-white outline-none focus:shadow-none"
          style={{ boxShadow: "none", border: 0 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === "," || e.key === " ") { e.preventDefault(); commit(); } }}
          onBlur={commit}
          placeholder={value.length === 0 ? t("portList.placeholderEmpty") : t("portList.placeholderAdd")}
        />
      </div>
    </label>
  );
}
