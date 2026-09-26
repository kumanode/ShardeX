import { useState, type FormEvent } from "react";
import { DialogModal, Input } from "@proxyshard/shardx-ui-kit";
import { KeyIcon, LockedIcon, EyeIcon, EyeOffIcon, DeleteIcon } from "../../shared/icons";
import { useCredentials, VAULT_RESET_PHRASE } from "../../entities/credentials";
import { useT } from "../../shared/i18n";

type Props = {
  /** Called after a successful setup or unlock. The page also re-renders on
   *  its own, since it subscribes to `status`. */
  onDone?: () => void;
};

export function VaultGateModal({ onDone }: Props) {
  const t = useT();
  const status = useCredentials((s) => s.status);
  const setup = useCredentials((s) => s.setup);
  const unlock = useCredentials((s) => s.unlock);
  const reset = useCredentials((s) => s.reset);
  const loading = useCredentials((s) => s.loading);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  const isSetup = !status?.configured;

  const closeReset = () => {
    setResetOpen(false);
    setPhrase("");
    setResetError(null);
  };

  const submitReset = async () => {
    setResetError(null);
    const res = await reset();
    // On success `status.configured` flips to false and this card becomes the
    // create-store form on its own — nothing to navigate.
    if (res.ok) closeReset();
    else setResetError(res.error ?? t("credentials.errResetFailed"));
  };

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
      if (ok) {
        onDone?.();
      } else {
        setError(t("credentials.errWrong"));
      }
    } else {
      if (!password) return;
      const ok = await unlock(password);
      if (ok) {
        onDone?.();
      } else {
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

        {/* There is no recovery path for a forgotten master password, so the
            warning belongs on the screen that creates it — not only in a modal
            the operator may never open. */}
        {isSetup && (
          <div className="mb-4 rounded-[14px] bg-amber-500/10 border border-amber-500/20 p-3 text-[12.5px] font-medium text-amber-700 dark:text-amber-400">
            {t("credentials.warnNoReset")}
          </div>
        )}

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
            className="btn-accent mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[18px] py-2.5 text-[13.5px] font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

        {/* The way out of a forgotten master password. Only meaningful while
            unlocking: on the create screen there is nothing to reset yet. */}
        {!isSetup && (
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="mt-3 w-full cursor-pointer text-center text-[12.5px] text-[var(--color-mid-gray,#737373)] transition-colors hover:text-rose-600 dark:hover:text-rose-400"
          >
            {t("credentials.forgotMaster")}
          </button>
        )}

        {/* Security badge footer */}
        <div className="mt-5 border-t border-[var(--color-hairline,#e5e5e5)] pt-4 text-center">
          <p className="text-[11.5px] text-[var(--color-mid-gray,#737373)] leading-relaxed">
            {t("credentials.securityFootnote")}
          </p>
        </div>
      </div>

      {resetOpen && (
        <DialogModal
          open={resetOpen}
          onClose={closeReset}
          icon={<DeleteIcon className="size-5" />}
          title={t("credentials.forgotTitle")}
          confirmLabel={t("credentials.resetVault")}
          onConfirm={submitReset}
          isDisabled={loading || phrase !== VAULT_RESET_PHRASE}
          cancelLabel={t("credentials.cancel")}
          onCancel={closeReset}
        >
          <div className="flex flex-col gap-3.5 py-1">
            <div className="rounded-[14px] border border-rose-500/20 bg-rose-500/10 p-3 text-[12.5px] font-medium leading-relaxed text-rose-600 dark:text-rose-400">
              {t("credentials.forgotIntro")}
            </div>
            {resetError && (
              <div className="rounded-[14px] border border-rose-500/20 bg-rose-500/10 p-3 text-[12.5px] font-medium text-rose-600 dark:text-rose-400">
                {resetError}
              </div>
            )}
            <Input
              label={t("credentials.resetTypePrompt", { phrase: VAULT_RESET_PHRASE })}
              value={phrase}
              onChange={(e) => {
                setPhrase(e.target.value);
                setResetError(null);
              }}
              placeholder={VAULT_RESET_PHRASE}
            />
          </div>
        </DialogModal>
      )}
    </div>
  );
}
