import { Component, type ErrorInfo, type ReactNode } from "react";
import { translate } from "../shared/i18n";

// Last line of defence. A component that throws during render unmounts the
// whole tree, and this app's root would then show an empty window with no way
// to recover. A guard here keeps a visible, reloadable screen instead.
type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const t = (k: string) => translate("en", k);
    return (
      <div
        className="flex min-h-screen items-center justify-center p-6"
        style={{ background: "var(--surface-canvas, #f5f5f5)" }}
      >
        <div className="w-full max-w-md rounded-[24px] border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)] p-6 text-center shadow-[var(--shadow-subtle)]">
          <div className="mb-2 text-page-title">{t("app.crashTitle")}</div>
          <p className="mb-5 text-paragraph-xs text-zinc-500 dark:text-zinc-400">
            {t("app.crashBody")}
          </p>
          <pre className="mb-5 max-h-40 overflow-auto rounded-[14px] bg-[var(--color-canvas,#f5f5f5)] p-3 text-left text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
            {String(this.state.error?.message ?? this.state.error)}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="cursor-pointer rounded-[10px] bg-[var(--color-ink,#0a0a0a)] px-4 py-2 text-paragraph-xs font-medium text-white"
          >
            {t("app.crashReload")}
          </button>
        </div>
      </div>
    );
  }
}
