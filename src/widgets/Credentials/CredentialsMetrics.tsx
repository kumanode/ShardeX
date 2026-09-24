import { Metric } from "../../shared/ui/Metric";
import { useCredentials } from "../../entities/credentials";
import { useT } from "../../shared/i18n";
import { KeyIcon, NavBrowsersIcon, GlobeIcon, ClockIcon } from "../../shared/icons";

export function CredentialsMetrics() {
  const t = useT();
  const credentials = useCredentials((s) => s.credentials);

  const totalAccounts = credentials.length;
  const linkedProfiles = new Set(credentials.map((c) => c.profile_id)).size;
  const activeProviders = new Set(credentials.map((c) => c.provider)).size;
  const activeKeepAlive = credentials.filter((c) => (c.keep_alive_minutes ?? 0) > 0).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6 min-w-0">
      <Metric
        label={t("credentialsMetrics.accounts")}
        value={String(totalAccounts)}
        icon={<KeyIcon className="size-4.5" />}
      />
      <Metric
        label={t("credentialsMetrics.profiles")}
        value={String(linkedProfiles)}
        icon={<NavBrowsersIcon className="size-4.5" />}
      />
      <Metric
        label={t("credentialsMetrics.providers")}
        value={String(activeProviders)}
        icon={<GlobeIcon className="size-4.5" />}
      />
      <Metric
        label={t("credentialsMetrics.keepAlive")}
        value={String(activeKeepAlive)}
        pulse={activeKeepAlive > 0}
        icon={<ClockIcon className="size-4.5" />}
      />
    </div>
  );
}
