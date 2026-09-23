import { usePsConnected } from "../../entities/proxyshard";
import { PsResidentialCard, PsOrdersCard, PsBuyCard } from "../../features/proxyshard";
import { useT } from "../../shared/i18n";

export function PsManagementPanels() {
  const t = useT();
  const connected = usePsConnected();

  if (!connected) {
    return (
      <div className="rounded-[24px] bg-[var(--color-paper,#ffffff)] p-5 border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)]">
        <p className="m-0 text-paragraph-sm text-zinc-500 dark:text-zinc-400">
          {t("psManagementPanels.needKey")}
        </p>
      </div>
    );
  }

  return (
    <>
      <PsResidentialCard />
      <PsOrdersCard />
      <PsBuyCard />
    </>
  );
}
