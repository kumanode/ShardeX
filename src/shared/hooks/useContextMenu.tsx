import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ContextItem } from "../types";

/// Right-click context menu styled after the UI-kit dropdown surface.
export function useContextMenu() {
  const [menu, setMenu] = useState<{ x: number; y: number; items: ContextItem[] } | null>(null);
  const close = () => setMenu(null);
  useEffect(() => {
    if (!menu) return;
    const dismiss = () => close();
    window.addEventListener("click", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => {
      window.removeEventListener("click", dismiss);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, [menu]);
  const open = (e: React.MouseEvent, items: ContextItem[]) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, items });
  };
  // Clamp menu into viewport post-layout.
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!menu || !el) return;
    const { width, height } = el.getBoundingClientRect();
    const pad = 8;
    let left = menu.x;
    let top = menu.y;
    if (left + width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - width - pad);
    }
    if (top + height > window.innerHeight - pad) {
      top = Math.max(pad, window.innerHeight - height - pad);
    }
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [menu]);
  const node = menu ? (
    <div
      ref={ref}
      className="fixed z-9000 min-w-[170px] rounded-[18px] bg-[var(--color-paper,#ffffff)] p-1.5 shadow-[var(--shadow-subtle)] border border-[var(--color-hairline,#e5e5e5)]"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {menu.items.map((it, i) =>
        it.sep ? (
          <div key={i} className="my-1 border-t border-[var(--color-hairline,#e5e5e5)]" />
        ) : (
          <button
            key={i}
            className={`w-full cursor-pointer rounded-[10px] border-0 bg-transparent px-3 py-2 text-left text-label-xs font-medium transition-colors ${
              it.danger
                ? "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                : "text-zinc-700 dark:text-zinc-200 hover:bg-[var(--color-surface-alt,#fafafa)] hover:text-zinc-900 dark:hover:text-white"
            }`}
            onClick={() => { it.onClick(); close(); }}
          >
            {it.label}
          </button>
        ),
      )}
    </div>
  ) : null;
  return { open, node };
}
