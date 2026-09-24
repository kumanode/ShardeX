import { getCurrentWindow } from "@tauri-apps/api/window";
import { HOST_OS } from "../../shared/lib/utils";
import { useT } from "../../shared/i18n";
import { ShardMini } from "../../shared/icons";

export function TitleBar() {
  const t = useT();
  return (
    <div
      className={`fixed left-0 right-0 top-0 z-10000 flex select-none items-center justify-center border-b border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] [-webkit-user-select:none]${HOST_OS === "macOS" ? " titlebar-mac" : " titlebar-custom"}`}
      style={{ height: "var(--titlebar-h)" }}
      data-tauri-drag-region
    >
      {HOST_OS !== "macOS" && (
        <div className="pointer-events-none absolute left-3 flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <span className="text-[var(--color-ink,#0a0a0a)] dark:text-zinc-200 flex items-center">
            <ShardMini className="size-3.5" />
          </span>
          <span className="font-mono text-[10.5px] font-medium tracking-[0.06em] uppercase text-[var(--color-mid-gray,#737373)]">
            ShardeX
          </span>
        </div>
      )}
      <span className="pointer-events-none font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-mid-gray,#737373)]">
        {t("titleBar.appName")}
      </span>
      {/* Custom min/max/close on Win/Linux (macOS uses native traffic lights). */}
      {HOST_OS !== "macOS" && (
        <div className="absolute right-0 top-0 flex h-full">
          <button
            className="flex h-full w-[46px] cursor-default items-center justify-center border-none bg-transparent p-0 text-[var(--color-mid-gray,#737373)] transition-colors hover:bg-[var(--color-canvas,#f5f5f5)] hover:text-[var(--color-ink,#0a0a0a)]"
            aria-label={t("titleBar.minimize")}
            onClick={() => getCurrentWindow().minimize()}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
          <button
            className="flex h-full w-[46px] cursor-default items-center justify-center border-none bg-transparent p-0 text-[var(--color-mid-gray,#737373)] transition-colors hover:bg-[var(--color-canvas,#f5f5f5)] hover:text-[var(--color-ink,#0a0a0a)]"
            aria-label={t("titleBar.maximize")}
            onClick={() => getCurrentWindow().toggleMaximize()}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <rect x="1.5" y="1.5" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
          <button
            className="flex h-full w-[46px] cursor-default items-center justify-center border-none bg-transparent p-0 text-[var(--color-mid-gray,#737373)] transition-colors hover:bg-[var(--color-ember,#e7000b)]! hover:text-white!"
            aria-label={t("titleBar.close")}
            onClick={() => getCurrentWindow().close()}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1" />
              <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
