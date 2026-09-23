import { useEffect, useState } from "react";
import Badge from "../../../shared/ui/Badge";
import {
  GlobeIcon,
  ClockIcon,
  BuildingIcon,
} from "../../../shared/icons";
import { CountryFlag } from "../../../shared/ui/CountryFlag";
import { toast } from "../../../shared/model/toast";
import { fmtTs } from "../../../shared/lib/utils";
import { useT } from "../../../shared/i18n";
import type { ProxyEntry, ProxyTestSnapshot } from "../../../entities/proxy";
import { proxyHistory } from "../../../entities/proxy";

/// Proxy detail popover: latest IP/geo + UDP + IP-change history.
export function ProxyInfoPopover({
  proxy, anchor, latest, onClose,
}: {
  proxy: ProxyEntry;
  anchor: { x: number; y: number };
  latest?: ProxyTestSnapshot;
  onClose: () => void;
}) {
  const t = useT();
  const [history, setHistory] = useState<ProxyTestSnapshot[]>([]);
  useEffect(() => {
    proxyHistory(proxy.id)
      .then((h) => setHistory([...h].reverse()))
      .catch((e) => toast.err(String(e)));
  }, [proxy.id]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".proxy-popover")) onClose();
    };
    window.addEventListener("mousedown", onDoc);
    return () => window.removeEventListener("mousedown", onDoc);
  }, [onClose]);

  // Clamp inside viewport to avoid clipping at the right edge.
  const left = Math.min(anchor.x, window.innerWidth - 360);
  const top = Math.min(anchor.y + 8, window.innerHeight - 320);

  return (
    <div
      className="proxy-popover fixed z-250 flex max-h-[480px] w-[340px] animate-[fadeUp_0.12s_ease-out] flex-col overflow-hidden rounded-[20px] bg-[var(--color-paper,#ffffff)] shadow-2xl border border-[var(--color-hairline,#e5e5e5)]"
      style={{ left, top }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-1.5 px-4 py-3.5">
        {latest?.ip ? (
          <>
            <div className="flex items-center gap-2.5 text-paragraph-sm text-zinc-800 dark:text-zinc-200">
              <span className="inline-grid w-5 place-items-center text-zinc-400 dark:text-zinc-500"><GlobeIcon className="size-4" /></span>
              <span className="mono">{latest.ip}</span>
            </div>
            <div className="flex items-center gap-2.5 text-paragraph-sm text-zinc-800 dark:text-zinc-200">
              <span className="inline-grid w-5 place-items-center text-zinc-400 dark:text-zinc-500">
                {latest.country_code ? <CountryFlag cc={latest.country_code} height={14} /> : <GlobeIcon className="size-4" />}
              </span>
              <span>{[latest.region, latest.city].filter(Boolean).join(", ") || latest.country || "—"}</span>
            </div>
            {latest.timezone && (
              <div className="flex items-center gap-2.5 text-paragraph-sm text-zinc-800 dark:text-zinc-200">
                <span className="inline-grid w-5 place-items-center text-zinc-400 dark:text-zinc-500"><ClockIcon className="size-4" /></span>
                <span>{latest.timezone}</span>
              </div>
            )}
            {latest.isp && (
              <div className="flex items-center gap-2.5 text-paragraph-sm text-zinc-800 dark:text-zinc-200">
                <span className="inline-grid w-5 place-items-center text-zinc-400 dark:text-zinc-500"><BuildingIcon className="size-4" /></span>
                <span className="text-paragraph-xs text-zinc-500 dark:text-zinc-400">{latest.isp}</span>
              </div>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge color={latest.tcp_ms != null ? "success" : "error"} variant="lighter" size="small">
                TCP {latest.tcp_ms != null ? `${latest.tcp_ms} ms` : "✗"}
              </Badge>
              {proxy.kind === "socks5" && (
                <Badge
                  color={latest.udp_ms != null ? "success" : "error"}
                  variant="lighter"
                  size="small"
                  title={latest.udp_error ?? undefined}
                >
                  UDP {latest.udp_ms != null ? `${latest.udp_ms} ms` : "✗"}
                </Badge>
              )}
            </div>
            {latest.geo_error && (
              <div className="mt-1.5 text-paragraph-xs text-error-base">
                {t("proxyInfoPopover.geoError", { error: latest.geo_error })}
              </div>
            )}
          </>
        ) : (
          <div className="text-paragraph-xs text-zinc-500 dark:text-zinc-400">{t("proxyInfoPopover.notTested")}</div>
        )}
      </div>
      <div className="border-b border-t border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400">{t("proxyInfoPopover.historyTitle")}</div>
      <div className="flex-1 overflow-y-auto py-1">
        {history.length === 0 && <div className="px-4 py-2.5 text-paragraph-xs text-zinc-500 dark:text-zinc-400">{t("proxyInfoPopover.historyEmpty")}</div>}
        {history.map((s, i) => (
          <div key={`${s.ip}-${s.first_seen}-${i}`} className="border-b border-[var(--color-hairline,#e5e5e5)] px-4 py-2 last:border-b-0">
            <div className="flex items-center gap-2 text-paragraph-sm text-zinc-800 dark:text-zinc-200">
              <span className="mono">{s.ip || "—"}</span>
              {s.country_code && (
                <>
                  <CountryFlag cc={s.country_code} />
                  <span className="text-paragraph-xs text-zinc-600 dark:text-zinc-300">{s.country_code}</span>
                </>
              )}
              {s.city && <span className="text-paragraph-xs text-zinc-500 dark:text-zinc-400">{s.city}</span>}
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
              {fmtTs(s.first_seen)}
              {s.first_seen !== s.last_seen && <> → {fmtTs(s.last_seen)}</>}
              {s.udp_ms != null && <> · UDP ✓</>}
              {s.udp_error && <> · UDP ✗</>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
