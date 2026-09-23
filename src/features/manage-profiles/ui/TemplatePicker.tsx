import { useEffect, useState } from "react";
import { Modal } from "@proxyshard/shardx-ui-kit";
import type { FingerprintEntry } from "../../../entities/fingerprint";
import { fingerprintList } from "../../../entities/fingerprint";
import { hostPlatform } from "../../../entities/profile";
import { useGpuCompat } from "../../../shared/model/gpuCompat";
import { IncompatibleBadge } from "../../gpu-compat";

export function TemplatePicker({
  fingerprints,
  onPick,
  onClose,
}: {
  /** When passed in, skip the fingerprint_list IO and the visible mount
   *  flash that used to happen while the 170-entry list streamed back. */
  fingerprints?: FingerprintEntry[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [lib, setLib] = useState<FingerprintEntry[]>(fingerprints ?? []);
  const [host, setHost] = useState<string>("");
  useEffect(() => {
    if (!fingerprints) {
      fingerprintList().then(setLib).catch(() => {});
    }
    hostPlatform().then(setHost).catch(() => {});
  }, [fingerprints]);
  // Only host-matching fingerprints (UA/fonts/WebGL renderer are host-coupled).
  const tpls = host ? lib.filter((e) => e.platform === host) : [];
  // Verdicts for the badge. Loading here as well as in the editor is
  // deliberate: whichever the operator opens first pays for the probe, and the
  // store makes the second one free.
  const compatById = useGpuCompat((st) => st.byId);
  const loadCompat = useGpuCompat((st) => st.load);
  useEffect(() => { void loadCompat(); }, [loadCompat]);

  return (
    <Modal
      open
      onClose={onClose}
      title={`Pick a ${host || ""} fingerprint`}
      maxWidthClassName="max-w-[880px]"
    >
      {tpls.length === 0 ? (
        <div className="rounded-[18px] bg-[var(--color-surface-alt,#fafafa)] border border-[var(--color-hairline,#e5e5e5)] px-4 py-8 text-center text-paragraph-sm text-zinc-500 dark:text-zinc-400">
          No {host} fingerprints in the library yet. Add some on the
          Fingerprints page (or drop JSONs into the library folder).
        </div>
      ) : (
        <div className="grid max-h-[60vh] grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 overflow-y-auto p-1">
          {tpls.map((t) => (
            <button
              key={t.id}
              className="relative flex cursor-pointer flex-col gap-1.5 overflow-hidden rounded-[18px] bg-[var(--color-paper,#ffffff)] px-4 py-3.5 pb-3 text-left border border-[var(--color-hairline,#e5e5e5)] shadow-xs transition-all hover:bg-[var(--color-surface-alt,#fafafa)] hover:border-zinc-400 dark:hover:border-zinc-500 active:translate-y-px"
              onClick={() => onPick(t.id)}
            >
              <div
                className="absolute left-0 right-0 top-0 h-[3px] opacity-85"
                style={{ background: t.tag_color }}
              />
              <div className="mt-1 flex items-center justify-between gap-2 text-subheading-2xs">
                <span className="text-zinc-900 dark:text-white font-semibold">{t.platform}</span>
                <span className="flex items-center gap-1.5">
                  {compatById[t.id] && <IncompatibleBadge compat={compatById[t.id]} />}
                  <span className="font-mono text-zinc-500 dark:text-zinc-400">Chrome {t.chrome}</span>
                </span>
              </div>
              <div className="mt-0.5 text-label-sm font-semibold text-zinc-900 dark:text-white">{t.label}</div>
              <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate">{t.gpu}</div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
