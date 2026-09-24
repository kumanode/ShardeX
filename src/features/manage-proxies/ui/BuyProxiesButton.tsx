import { Button } from "@proxyshard/shardx-ui-kit";
import { useT } from "../../../shared/i18n";
import { useNav } from "../../../shared/model/navigation";
import { NavShopIcon } from "../../../shared/icons";

export function BuyProxiesButton() {
  const t = useT();
  const setProxyTab = useNav((s) => s.setProxyTab);
  return (
    <Button
      variant="neutral"
      mode="stroke"
      size="small"
      leftIcon={<NavShopIcon className="size-4" />}
      onClick={() => setProxyTab("proxyshard")}
      title={t("buyProxiesButton.tooltip")}
    >
      {t("buyProxiesButton.label")} <span className="ml-1 opacity-70">{t("buyProxiesButton.badge")}</span>
    </Button>
  );
}
