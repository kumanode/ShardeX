import { useState } from "react";
import { DialogModal, Input } from "@proxyshard/shardx-ui-kit";
import { useCredentials, VAULT_RESET_PHRASE } from "../../entities/credentials";
import { KeyIcon, DeleteIcon } from "../../shared/icons";
import { useT } from "../../shared/i18n";

const NEUTRAL_BTN =
  "flex cursor-pointer items-center gap-2 rounded-[18px] border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-ink,#0a0a0a)] hover:bg-[var(--color-canvas,#f5f5f5)] shadow-xs transition-all";
const DANGER_BTN =
  "flex cursor-pointer items-center gap-2 rounded-[18px] border border-rose-500/30 bg-rose-500/5 px-3.5 py-2 text-[13px] font-medium text-rose-600 hover:bg-rose-500/10 shadow-xs transition-all";

export function VaultSecurityPanel() {
  const t = useT();
  const changeMaster = useCredentials((s) => s.changeMaster);
  const reset = useCredentials((s) => s.reset);
  const loading = useCredentials((s) => s.loading);

  const [pwdOpen, setPwdOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [phrase, setPhrase] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  const closePwd = () => {
    setPwdOpen(false);
    setOldPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setPwdError(null);
  };

  const closeReset = () => {
    setResetOpen(false);
    setPhrase("");
    setResetError(null);
  };

  const submitPwd = async () => {
    setPwdError(null);
    if (newPwd !== confirmPwd) {
      setPwdError(t("credentials.errMismatch"));
      return;
    }
    if (newPwd === oldPwd) {
      setPwdError(t("credentials.errSamePassword"));
      return;
    }
    // The store returns the backend's own message (a wrong current password
    // reads differently from a write failure), so the dialog shows that exact
    // reason instead of a generic one.
    const res = await changeMaster(oldPwd, newPwd);
    if (res.ok) closePwd();
    else setPwdError(res.error ?? t("credentials.errChangeFailed"));
  };

  const submitReset = async () => {
    setResetError(null);
    const res = await reset();
    if (res.ok) closeReset();
    else setResetError(res.error ?? t("credentials.errResetFailed"));
  };

  return (
    <>
      <div className="mt-5 flex flex-col gap-3 rounded-[24px] border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)] p-4 shadow-[var(--shadow-subtle)] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-[var(--color-ink,#0a0a0a)]">
            {t("credentials.securityTitle")}
          </div>
          <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--color-mid-gray,#737373)]">
            {t("credentials.securityHint")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button type="button" onClick={() => setPwdOpen(true)} className={NEUTRAL_BTN}>
            <KeyIcon className="size-3.5" />
            <span>{t("credentials.changeMaster")}</span>
          </button>
          <button type="button" onClick={() => setResetOpen(true)} className={DANGER_BTN}>
            <DeleteIcon className="size-3.5" />
            <span>{t("credentials.resetVault")}</span>
          </button>
        </div>
      </div>

      {pwdOpen && (
        <DialogModal
          open={pwdOpen}
          onClose={closePwd}
          icon={<KeyIcon className="size-5" />}
          title={t("credentials.changeMasterTitle")}
          confirmLabel={t("credentials.save")}
          onConfirm={submitPwd}
          isDisabled={
            loading ||
            !oldPwd ||
            newPwd.length < 8 ||
            newPwd !== confirmPwd
          }
          cancelLabel={t("credentials.cancel")}
          onCancel={closePwd}
        >
          <div className="flex flex-col gap-3.5 py-1">
            {pwdError && (
              <div className="rounded-[14px] border border-rose-500/20 bg-rose-500/10 p-3 text-[12.5px] font-medium text-rose-600 dark:text-rose-400">
                {pwdError}
              </div>
            )}
            <Input
              label={t("credentials.currentMaster")}
              type="password"
              value={oldPwd}
              onChange={(e) => {
                setOldPwd(e.target.value);
                setPwdError(null);
              }}
              placeholder="••••••••••••"
            />
            <Input
              label={t("credentials.newMaster")}
              type="password"
              value={newPwd}
              onChange={(e) => {
                setNewPwd(e.target.value);
                setPwdError(null);
              }}
              placeholder="••••••••••••"
            />
            <Input
              label={t("credentials.confirmNewMaster")}
              type="password"
              value={confirmPwd}
              onChange={(e) => {
                setConfirmPwd(e.target.value);
                setPwdError(null);
              }}
              placeholder="••••••••••••"
            />
          </div>
        </DialogModal>
      )}

      {resetOpen && (
        <DialogModal
          open={resetOpen}
          onClose={closeReset}
          icon={<DeleteIcon className="size-5" />}
          title={t("credentials.resetTitle")}
          confirmLabel={t("credentials.resetVault")}
          onConfirm={submitReset}
          isDisabled={loading || phrase !== VAULT_RESET_PHRASE}
          cancelLabel={t("credentials.cancel")}
          onCancel={closeReset}
        >
          <div className="flex flex-col gap-3.5 py-1">
            <div className="rounded-[14px] border border-rose-500/20 bg-rose-500/10 p-3 text-[12.5px] font-medium leading-relaxed text-rose-600 dark:text-rose-400">
              {t("credentials.resetWarning")}
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
    </>
  );
}
