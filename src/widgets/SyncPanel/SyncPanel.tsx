import { useEffect, useRef, useState } from "react";
import {
  syncStatus, syncSetPaused, syncArrange, syncStop, syncSetExcluded,
  syncClosePanel, syncSetMaster, syncSetDelay, syncNavigate, syncReload,
  syncNewTab, syncCloseTab,
  type SyncStatus, type SyncLayout,
} from "../../entities/profile/model/api";
import {
  PlayIcon, PauseIcon, SyncIcon, StopIcon, RefreshIcon, GlobeIcon,
  StarOutlineIcon, ClockIcon, CloseIcon, AddIcon,
} from "../../shared/icons";
import { useT } from "../../shared/i18n";
import { dragWindowOnMouseDown } from "../../shared/lib/dragWindow";

const DELAY_PRESETS = [0, 100, 250, 500];

/* ── Crisp vector icons for window layouts ── */
function LayoutRowIcon({ className = "size-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="5.5" height="10" rx="1" />
      <rect x="8.5" y="3" width="5.5" height="10" rx="1" />
    </svg>
  );
}

function LayoutGridIcon({ className = "size-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  );
}

function LayoutCascadeIcon({ className = "size-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="8" height="7" rx="1" />
      <path d="M5 9V13a1 1 0 001 1h7a1 1 0 001-1V6a1 1 0 00-1-1H10" />
    </svg>
  );
}

export function SyncPanel({ group }: { group: string }) {
  const t = useT();
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  // Must survive the second before the first browser connects, and go once
  // they are all gone.
  const everHadMembers = useRef(false);

  useEffect(() => {
    if (group === "preview" || group === "fleet-preview") {
      setStatus({
        group,
        paused: false,
        master: "profile-1",
        delay_ms: 100,
        members: [
          { profile: "profile-1", name: "Alpha Leader", driving: true, excluded: false, is_master: true },
          { profile: "profile-2", name: "Beta Worker", driving: false, excluded: false, is_master: false },
          { profile: "profile-3", name: "Gamma Mirror", driving: false, excluded: true, is_master: false },
        ],
      });
      return;
    }
    let alive = true;
    const tick = async () => {
      try {
        const s = await syncStatus(group);
        if (!alive) return;
        setStatus(s);
        if (s.members.length > 0) everHadMembers.current = true;
        else if (everHadMembers.current) void syncClosePanel();
      } catch { /* the group may not exist yet */ }
    };
    void tick();
    const id = setInterval(tick, 1000);
    return () => { alive = false; clearInterval(id); };
  }, [group]);

  const paused = status?.paused ?? false;
  const members = status?.members ?? [];
  const currentMaster = status?.master ?? null;
  const currentDelay = status?.delay_ms ?? 0;

  // Guards against a double click slipping through before `busy` re-renders:
  // a second "+" arriving in the same tick would open a second tab.
  const inFlight = useRef(false);
  const isPreview = group === "preview" || group === "fleet-preview";

  const run = async (fn: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try { await fn(); } catch { /* the next poll shows the truth */ }
    setBusy(false);
    inFlight.current = false;
  };

  const handlePause = () => {
    if (isPreview) {
      setStatus((s) => s ? { ...s, paused: !s.paused } : null);
    } else {
      void run(() => syncSetPaused(group, !paused));
    }
  };

  const handleSetMaster = (m: string | null) => {
    if (isPreview) {
      setStatus((s) => s ? {
        ...s,
        master: m,
        members: s.members.map((mem) => ({ ...mem, is_master: mem.profile === m })),
      } : null);
    } else {
      void run(() => syncSetMaster(group, m));
    }
  };

  const handleSetDelay = (ms: number) => {
    if (isPreview) {
      setStatus((s) => s ? { ...s, delay_ms: ms } : null);
    } else {
      void run(() => syncSetDelay(group, ms));
    }
  };

  const handleSetExcluded = (profile: string, excl: boolean) => {
    if (isPreview) {
      setStatus((s) => s ? {
        ...s,
        members: s.members.map((mem) => mem.profile === profile ? { ...mem, excluded: excl } : mem),
      } : null);
    } else {
      void run(() => syncSetExcluded(group, profile, excl));
    }
  };

  const handleNavigate = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    void run(() => syncNavigate(group, trimmed));
  };

  return (
    <div
      onMouseDown={dragWindowOnMouseDown}
      className="flex h-full w-full flex-col rounded-[22px] bg-[var(--color-paper,#ffffff)] border border-[var(--color-hairline,#e5e5e5)] shadow-2xl overflow-hidden select-none font-sans"
    >
      {/* ── Top Bar: Drag Header & Primary Controls ── */}
      <div className="flex shrink-0 items-center justify-between gap-1.5 px-3 pt-2 pb-1.5 border-b border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)]">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-[7px] bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-2xs">
            <SyncIcon className="size-3" />
          </div>
          <span className="text-[12px] font-semibold text-[var(--color-ink,#0a0a0a)] tracking-tight shrink-0">
            ShardX Sync
          </span>
          <span className="inline-flex items-center rounded-full bg-[var(--color-surface-alt,#fafafa)] border border-[var(--color-hairline,#e5e5e5)] px-1.5 py-0.2 text-[9px] font-medium text-[var(--color-mid-gray,#737373)] font-mono shrink-0">
            {members.length}
          </span>
          {currentMaster && (
            <span
              title={`${t("syncPanel.master")}: ${
                members.find((m) => m.profile === currentMaster)?.name || currentMaster
              }`}
              className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 dark:bg-amber-400/15 px-2 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/25 truncate max-w-[6.5rem]"
            >
              <span className="text-[9px]">★</span>
              <span className="truncate">{members.find((m) => m.profile === currentMaster)?.name || currentMaster}</span>
            </span>
          )}
        </div>

        {/* Window & Group Controls */}
        <div className="flex items-center gap-1 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          {/* Pause / Resume Toggle */}
          <button
            type="button"
            disabled={busy}
            onClick={handlePause}
            title={paused ? t("syncPanel.resume") : t("syncPanel.hold")}
            className={`flex size-6.5 items-center justify-center rounded-[8px] border transition-colors cursor-pointer disabled:cursor-not-allowed ${
              paused
                ? "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium"
                : "bg-[var(--color-surface-alt,#fafafa)] border-[var(--color-hairline,#e5e5e5)] text-zinc-600 dark:text-zinc-300 hover:text-[var(--color-ink,#0a0a0a)] hover:bg-[var(--color-paper,#ffffff)] shadow-2xs"
            } disabled:opacity-50`}
          >
            {paused ? <PlayIcon className="size-3" /> : <PauseIcon className="size-3" />}
          </button>

          {/* Stop All (Destructive Ember Action) */}
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => syncStop(group))}
            title={t("syncPanel.stopAll")}
            className="flex size-6.5 items-center justify-center rounded-[8px] text-[var(--color-ember,#e7000b)] border border-transparent hover:border-red-500/30 hover:bg-red-500/10 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <StopIcon className="size-3" />
          </button>

          {/* Close Panel */}
          <button
            type="button"
            onClick={() => void syncClosePanel()}
            title={t("syncPanel.closePanel")}
            className="flex size-6.5 items-center justify-center rounded-[8px] text-zinc-400 dark:text-zinc-500 hover:text-[var(--color-ink,#0a0a0a)] hover:bg-[var(--color-surface-alt,#fafafa)] border border-transparent hover:border-[var(--color-hairline,#e5e5e5)] transition-colors cursor-pointer"
          >
            <CloseIcon className="size-3" />
          </button>
        </div>
      </div>

      {/* ── URL Broadcast Bar ── */}
      <form
        onSubmit={handleNavigate}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 bg-[var(--color-surface-alt,#fafafa)] border-b border-[var(--color-hairline,#e5e5e5)]"
      >
        <div className="relative flex-1 min-w-0 flex items-center">
          <GlobeIcon className="absolute left-2.5 size-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={t("syncPanel.urlPlaceholder")}
            disabled={busy || members.length === 0}
            className="w-full h-7 rounded-[14px] bg-[var(--color-paper,#ffffff)] pl-7 pr-2.5 text-[11px] font-mono text-[var(--color-ink,#0a0a0a)] border border-[var(--color-hairline,#e5e5e5)] placeholder:text-zinc-400 dark:placeholder:text-zinc-500 placeholder:font-sans focus:outline-none focus:border-[var(--color-ink,#0a0a0a)] dark:focus:border-zinc-300 disabled:opacity-50 transition-colors shadow-2xs"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !urlInput.trim() || members.length === 0}
          className="h-7 rounded-[14px] bg-[var(--color-ink,#0a0a0a)] text-[var(--color-paper,#ffffff)] px-2.5 text-[11px] font-medium hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
        >
          {t("syncPanel.go")}
        </button>
        <div className="h-4 w-px bg-[var(--color-hairline,#e5e5e5)] mx-0.5 shrink-0" />
        <button
          type="button"
          disabled={busy || members.length === 0}
          onClick={() => run(() => syncReload(group))}
          title={t("syncPanel.reload")}
          className="flex size-6.5 shrink-0 items-center justify-center rounded-[8px] text-zinc-600 dark:text-zinc-300 border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)] hover:bg-[var(--color-surface-alt,#fafafa)] hover:text-[var(--color-ink,#0a0a0a)] disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-2xs"
        >
          <RefreshIcon className="size-3" />
        </button>
        <button
          type="button"
          disabled={busy || members.length === 0}
          onClick={() => run(() => syncNewTab(group, urlInput.trim() || undefined))}
          title={t("syncPanel.newTab")}
          className="flex size-6.5 shrink-0 items-center justify-center rounded-[8px] text-zinc-600 dark:text-zinc-300 border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)] hover:bg-[var(--color-surface-alt,#fafafa)] hover:text-[var(--color-ink,#0a0a0a)] disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-2xs"
        >
          <AddIcon className="size-3" />
        </button>
        <button
          type="button"
          disabled={busy || members.length === 0}
          onClick={() => run(() => syncCloseTab(group))}
          title={t("syncPanel.closeTab")}
          className="flex size-6.5 shrink-0 items-center justify-center rounded-[8px] text-zinc-600 dark:text-zinc-300 border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)] hover:bg-rose-500/10 hover:text-[var(--color-ember,#e7000b)] hover:border-red-500/30 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-2xs"
        >
          <CloseIcon className="size-3" />
        </button>
      </form>

      {/* ── Master Lock & Delay Controls Row ── */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="flex shrink-0 items-center justify-between gap-1.5 px-3 py-1 border-b border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)]"
      >
        {/* Master Selector */}
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-[10px] font-medium text-[var(--color-mid-gray,#737373)] flex items-center gap-1 shrink-0">
            <StarOutlineIcon className="size-3 text-amber-500" />
            {t("syncPanel.master")}:
          </span>
          <select
            value={currentMaster ?? ""}
            disabled={busy || members.length === 0}
            onChange={(e) => handleSetMaster(e.target.value || null)}
            className="max-w-[7rem] rounded-[7px] bg-[var(--color-surface-alt,#fafafa)] py-0.5 pl-1.5 pr-3 text-[10px] font-medium text-[var(--color-ink,#0a0a0a)] border border-[var(--color-hairline,#e5e5e5)] focus:outline-none focus:border-[var(--color-ink,#0a0a0a)] truncate cursor-pointer disabled:opacity-50 transition-colors"
          >
            <option value="">{t("syncPanel.masterAuto")}</option>
            {members.map((m) => (
              <option key={m.profile} value={m.profile}>
                ★ {m.name || m.profile}
              </option>
            ))}
          </select>
        </div>

        {/* Delay Presets - Clean Segmented Control */}
        <div className="flex items-center gap-1 shrink-0">
          <span title={t("syncPanel.delay")} className="text-[10px] font-medium text-[var(--color-mid-gray,#737373)] flex items-center">
            <ClockIcon className="size-3" />
          </span>
          <div className="flex items-center gap-0.5 rounded-[9px] bg-[var(--color-surface-alt,#fafafa)] p-0.5 border border-[var(--color-hairline,#e5e5e5)]">
            {DELAY_PRESETS.map((ms) => {
              const active = currentDelay === ms;
              return (
                <button
                  key={ms}
                  type="button"
                  disabled={busy}
                  onClick={() => handleSetDelay(ms)}
                  className={`rounded-[6px] px-1.5 py-0.5 text-[9px] font-medium transition-all cursor-pointer disabled:cursor-not-allowed ${
                    active
                      ? "bg-[var(--color-paper,#ffffff)] text-[var(--color-ink,#0a0a0a)] font-semibold shadow-2xs border border-[var(--color-hairline,#e5e5e5)]"
                      : "text-[var(--color-mid-gray,#737373)] hover:text-[var(--color-ink,#0a0a0a)] border border-transparent"
                  }`}
                >
                  {ms === 0 ? "0ms" : `${ms}ms`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Window Layout Row ── */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="flex shrink-0 items-center gap-1 px-3 py-1 border-b border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)]"
      >
        <span className="text-[10px] font-medium text-[var(--color-mid-gray,#737373)] shrink-0 w-11">
          Layout:
        </span>
        <div className="grid grid-cols-3 gap-1 flex-1">
          {(["row", "grid", "cascade"] as SyncLayout[]).map((l) => (
            <button
              key={l}
              type="button"
              disabled={busy || members.length === 0}
              onClick={() => run(() => syncArrange(group, l))}
              className="flex items-center justify-center gap-1 rounded-[7px] py-0.8 px-1.5 text-[10px] font-medium capitalize text-[var(--color-ink,#0a0a0a)] bg-[var(--color-paper,#ffffff)] border border-[var(--color-hairline,#e5e5e5)] hover:border-zinc-400 dark:hover:border-zinc-500 shadow-2xs disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {l === "row" && <LayoutRowIcon className="size-3 text-zinc-500 dark:text-zinc-400" />}
              {l === "grid" && <LayoutGridIcon className="size-3 text-zinc-500 dark:text-zinc-400" />}
              {l === "cascade" && <LayoutCascadeIcon className="size-3 text-zinc-500 dark:text-zinc-400" />}
              <span>{l}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Member Chips ── */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="min-h-0 flex-1 content-start overflow-y-auto p-2.5 bg-[var(--color-paper,#ffffff)]"
      >
        {members.length === 0 ? (
          <div className="flex h-full items-center justify-center text-paragraph-xs text-[var(--color-mid-gray,#737373)]">
            {t("syncPanel.starting")}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {members.map((m) => {
              const isMaster = m.is_master;
              return (
                <div
                  key={m.profile}
                  className={`group inline-flex max-w-[11rem] items-center gap-1.5 rounded-full pl-2 pr-2.5 py-1 text-paragraph-xs border transition-all ${
                    m.excluded
                      ? "text-[var(--color-mid-gray,#737373)] line-through border-dashed border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)]/60 opacity-60"
                      : isMaster
                      ? "text-amber-700 dark:text-amber-300 border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 font-medium shadow-2xs"
                      : "text-[var(--color-ink,#0a0a0a)] border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] hover:bg-[var(--color-paper,#ffffff)] hover:border-zinc-400 dark:hover:border-zinc-500 shadow-2xs"
                  }`}
                >
                  {/* Master Star Toggle */}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleSetMaster(isMaster ? null : m.profile)}
                    title={isMaster ? t("syncPanel.unsetMaster") : t("syncPanel.setMaster")}
                    className="shrink-0 transition-transform active:scale-90 cursor-pointer"
                  >
                    <span className={`text-[11px] ${isMaster ? "text-amber-500 font-bold" : "text-zinc-400 hover:text-amber-500"}`}>
                      ★
                    </span>
                  </button>

                  {/* Driving / Status Dot */}
                  <span
                    className={`size-2 shrink-0 rounded-full transition-all ${
                      m.driving && !m.excluded
                        ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)] animate-pulse"
                        : "bg-zinc-300 dark:bg-zinc-600"
                    }`}
                  />

                  {/* Profile Name (Click to toggle exclude) */}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleSetExcluded(m.profile, !m.excluded)}
                    title={`${m.name || m.profile}${m.driving ? t("syncPanel.drivingSuffix") : ""}${
                      isMaster ? ` (${t("syncPanel.master")})` : ""
                    }\n${m.excluded ? t("syncPanel.chipBringBack") : t("syncPanel.chipHoldOut")}`}
                    className="truncate text-left flex-1 font-medium select-none cursor-pointer text-[11px]"
                  >
                    {m.name || m.profile}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
