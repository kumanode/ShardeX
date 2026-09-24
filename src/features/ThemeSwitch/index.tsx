import { SegmentControl, useTheme } from "@proxyshard/shardx-ui-kit";
import { SunIcon, MoonIcon } from "../../shared/icons";
import { useT } from "../../shared/i18n";

/// Light/dark switch — UI-kit SegmentControl bound to the kit ThemeProvider.
export function ThemeSwitch({ compact }: { compact?: boolean }) {
  const t = useT();
  const { resolvedTheme, setTheme } = useTheme();

  if (compact) {
    const isDark = resolvedTheme === "dark";
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        title={isDark ? t("themeSwitch.light") : t("themeSwitch.dark")}
        className="mb-2 flex size-10 items-center justify-center rounded-[18px] border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)] text-[var(--color-ink,#0a0a0a)] hover:bg-[var(--color-canvas,#f5f5f5)] transition-colors shadow-xs"
      >
        {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
      </button>
    );
  }

  return (
    <SegmentControl
      size="small"
      className="mb-2 w-full *:flex-1"
      value={resolvedTheme}
      items={[
        { value: "light", label: t("themeSwitch.light"), icon: <SunIcon className="size-4" /> },
        { value: "dark", label: t("themeSwitch.dark"), icon: <MoonIcon className="size-4" /> },
      ]}
      onChange={(v) => setTheme(v as "light" | "dark")}
    />
  );
}
