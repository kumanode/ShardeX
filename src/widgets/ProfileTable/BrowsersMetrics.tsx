import { Metric } from "../../shared/ui/Metric";
import { useProfile, useRunningCount } from "../../entities/profile";
import { useT } from "../../shared/i18n";
import {
  NavBrowsersIcon,
  PlayIcon,
  RouteIcon,
  NavFingerprintsIcon,
} from "../../shared/icons";

export function BrowsersMetrics() {
  const t = useT();
  const profileCount = useProfile((s) => s.profiles.length);
  const proxyCount = useProfile((s) => s.proxies.length);
  const fingerprintCount = useProfile((s) => s.fingerprints.length);
  const runningCount = useRunningCount();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Metric
        label={t("browsersMetrics.profiles")}
        value={String(profileCount)}
        color="indigo"
        icon={<NavBrowsersIcon className="size-5" />}
      />
      <Metric
        label={t("browsersMetrics.running")}
        value={String(runningCount)}
        pulse={runningCount > 0}
        color="emerald"
        icon={<PlayIcon className="size-4.5" />}
      />
      <Metric
        label={t("browsersMetrics.proxies")}
        value={String(proxyCount)}
        color="sky"
        icon={<RouteIcon className="size-5" />}
      />
      <Metric
        label={t("browsersMetrics.fingerprints")}
        value={String(fingerprintCount)}
        color="amber"
        icon={<NavFingerprintsIcon className="size-5" />}
      />
    </div>
  );
}
