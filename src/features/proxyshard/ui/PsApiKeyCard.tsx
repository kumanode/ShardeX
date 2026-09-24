import { useEffect, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button, Input } from "@proxyshard/shardx-ui-kit";
import { EyeIcon, EyeOffIcon, KeyIcon } from "../../../shared/icons";
import { DASHBOARD_URL } from "../../../shared/lib/utils";
import { useT } from "../../../shared/i18n";
import { PsConnectionBadge, usePsAccount } from "../../../entities/proxyshard";

export function PsApiKeyCard() {
  const t = useT();
  const key = usePsAccount((s) => s.key);
  const status = usePsAccount((s) => s.status);
  const me = usePsAccount((s) => s.me);
  const err = usePsAccount((s) => s.err);
  const saveKey = usePsAccount((s) => s.saveKey);
  const refreshMe = usePsAccount((s) => s.refreshMe);

  const [draft, setDraft] = useState("");
  const [showKey, setShowKey] = useState(false);

  // Sync the editable draft once the saved key loads from disk.
  useEffect(() => { setDraft(key ?? ""); }, [key]);

  return (
    <div className="mb-4 rounded-[24px] bg-[var(--color-paper,#ffffff)] p-5 border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)]">
      <h3 className="m-0 mb-1.5 text-label-sm font-semibold text-zinc-900 dark:text-white">{t("psApiKeyCard.title")}</h3>
      <p className="m-0 mb-2 text-paragraph-xs text-zinc-500 dark:text-zinc-400">
        {t("psApiKeyCard.hintPart1")}<strong>{t("psApiKeyCard.hintApiKey")}</strong>{t("psApiKeyCard.hintPart2")}{" "}
        <a
          href="#"
          className="text-[var(--color-ink,#0a0a0a)] dark:text-white underline font-medium"
          onClick={(e) => { e.preventDefault(); openUrl(DASHBOARD_URL).catch(() => {}); }}
        >{t("psApiKeyCard.hintDashboard")}</a>{t("psApiKeyCard.hintPart3")}<code>Authorization: Bearer …</code>{t("psApiKeyCard.hintPart4")}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Input
            inputSize="small"
            type={showKey ? "text" : "password"}
            placeholder={t("psApiKeyCard.inputPlaceholder")}
            leftIcon={<KeyIcon className="size-4" />}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveKey(draft); }}
            rightIcon={
              <button
                type="button"
                className="pointer-events-auto flex size-6 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent text-zinc-400 dark:text-zinc-500 transition-colors hover:bg-[var(--color-surface-alt,#fafafa)] hover:text-zinc-900 dark:hover:text-white"
                title={showKey ? t("psApiKeyCard.hideKeyTitle") : t("psApiKeyCard.showKeyTitle")}
                onClick={() => setShowKey((v) => !v)}
              >
                {showKey ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            }
          />
        </div>
        <Button
          variant="neutral"
          mode="filled"
          size="small"
          className="!bg-[var(--color-ink,#0a0a0a)] !text-white dark:!bg-white dark:!text-black"
          onClick={() => saveKey(draft)}
          disabled={draft.trim() === (key ?? "")}
        >
          {t("psApiKeyCard.saveButton")}
        </Button>
        <Button
          variant="neutral"
          mode="stroke"
          size="small"
          onClick={refreshMe}
          disabled={!key || status === "checking"}
          isLoading={status === "checking"}
        >
          {status === "checking" ? t("psApiKeyCard.checkingButton") : t("psApiKeyCard.testButton")}
        </Button>
      </div>
      <PsConnectionBadge status={status} me={me} err={err} hasKey={!!key} />
    </div>
  );
}
