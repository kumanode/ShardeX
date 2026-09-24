import { useEffect, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button, Modal } from "@proxyshard/shardx-ui-kit";
import { GithubMark } from "../../shared/icons";
import { GH_REPO_URL } from "../../shared/lib/utils";
import { useT } from "../../shared/i18n";

/// One-time GitHub-star prompt shown after the app first loads. Dismissal is
/// remembered in localStorage so it never nags again.
export function StarModal() {
  const t = useT();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("shardx-star-prompt") === "done") return;
    // Let the UI settle before surfacing the prompt.
    const timer = setTimeout(() => setShow(true), 700);
    return () => clearTimeout(timer);
  }, []);
  const close = () => {
    localStorage.setItem("shardx-star-prompt", "done");
    setShow(false);
  };
  const star = () => {
    openUrl(GH_REPO_URL).catch(() => {});
    close();
  };
  if (!show) return null;
  return (
    <Modal open onClose={close} maxWidthClassName="max-w-[416px]">
      <div className="px-2 pb-2 pt-4 text-center">
        <div className="relative mx-auto mb-4 flex size-[58px] items-center justify-center rounded-full bg-[var(--color-surface-alt,#fafafa)] text-zinc-900 dark:text-white border border-[var(--color-hairline,#e5e5e5)] shadow-xs">
          <GithubMark size={26} />
          <span className="absolute -top-[5px] right-[-3px] text-[19px] leading-none text-amber-500">★</span>
        </div>
        <h2 className="m-0 mb-2 text-[18px] font-semibold tracking-tight text-zinc-900 dark:text-white">{t("starModal.title")}</h2>
        <p className="m-0 mb-6 text-paragraph-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {t("starModal.blurbPart1")}<strong>{t("starModal.freeWord")}</strong>
          {t("starModal.blurbPart2")}<strong>{t("starModal.starWord")}</strong>
          {t("starModal.blurbPart3")}
        </p>
        <div className="flex justify-center gap-2.5">
          <Button variant="neutral" mode="stroke" size="small" onClick={close}>
            {t("starModal.later")}
          </Button>
          <Button variant="primary" mode="filled" size="small" leftIcon={<GithubMark />} onClick={star}>
            {t("starModal.starButton")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
