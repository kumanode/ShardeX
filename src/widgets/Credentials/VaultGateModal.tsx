import { useState, type FormEvent } from "react";
import { KeyIcon, LockedIcon, EyeIcon, EyeOffIcon } from "../../shared/icons";
import { useCredentials } from "../../entities/credentials";
import { useT } from "../../shared/i18n";

export function VaultGateModal() {
  const t = useT();
  const status = useCredentials((s) => s.status);
  const setup = useCredentials((s) => s.setup);
  const unlock = useCredentials((s) => s.unlock);
  const loading = useCredentials((s) => s.loading);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSetup = !status?.configured;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSetup) {
      if (password.length < 8) {
        setError(t("credentials.errMinLength"));
        return;
      }
      if (password !== confirmPassword) {
        setError(t("credentials.errMismatch"));
        return;
      }
      const ok = await setup(password);
      if (!ok) {
        setError(t("credentials.errWrong"));
      }
    } else {
      if (!password) return;
      const ok = await unlock(password);
      if (!ok) {
        setError(t("credentials.errWrong"));
      }
    }
  };

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[24px] border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)] p-6 sm:p-8 shadow-[var(--shadow-subtle)]">
        {/* Header Icon */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3.5 flex size-12 items-center justify-center rounded-[18px] bg-[var(--color-canvas,#f5f5f5)] text-[var(--color-ink,#0a0a0a)] border border-[var(--color-hairline,#e5e5e5)] shadow-xs">
            {isSetup ? <KeyIcon className="size-6 text-indigo-600 dark:text-indigo-400" /> : <LockedIcon className="size-6 text-zinc-700 dark:text-zinc-300" />}
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-[18px] bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2">
            {t("credentials.vaultBadge")}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--color-ink,#0a0a0a)]">
            {isSetup ? t("credentials.createStore") : t("credentials.title")}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-mid-gray,#737373)]">
            {isSetup ? t("credentials.setupIntro") : t("credentials.unlockIntro")}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 rounded-[14px] bg-rose-500/10 border border-rose-500/20 p-3 text-[12.5px] font-medium text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-mid-gray,#737373)]">
              {t("credentials.masterPassword")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                autoFocus
                placeholder="••••••••••••"
                className="w-full rounded-[18px] border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] px-4 py-2.5 pr-10 text-[13.5px] text-[var(--color-ink,#0a0a0a)] placeholder:text-zinc-400 focus:border-[var(--color-ink,#0a0a0a)] focus:bg-[var(--color-paper,#ffffff)] focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-mid-gray,#737373)] hover:text-[var(--color-ink,#0a0a0a)] cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </div>

          {isSetup && (
            <div>
              <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-mid-gray,#737373)]">
                {t("credentials.confirmMasterPassword")}
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••••••"
                className="w-full rounded-[18px] border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] px-4 py-2.5 text-[13.5px] text-[var(--color-ink,#0a0a0a)] placeholder:text-zinc-400 focus:border-[var(--color-ink,#0a0a0a)] focus:bg-[var(--color-paper,#ffffff)] focus:outline-none transition-all"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || (isSetup && !confirmPassword)}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[18px] bg-[var(--color-ink,#0a0a0a)] py-2.5 text-[13.5px] font-medium text-[var(--color-paper,#ffffff)] shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span>{t("credentials.loading")}</span>
            ) : isSetup ? (
              <span>{t("credentials.createStore")}</span>
            ) : (
              <span>{t("credentials.unlock")}</span>
            )}
          </button>
        </form>

        {/* Security badge footer */}
        <div className="mt-5 border-t border-[var(--color-hairline,#e5e5e5)] pt-4 text-center">
          <p className="text-[11.5px] text-[var(--color-mid-gray,#737373)] leading-relaxed">
            {t("credentials.securityFootnote")}
          </p>
        </div>
      </div>
    </div>
  );
}
