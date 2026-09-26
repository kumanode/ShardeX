import { useEffect, useRef, useState, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Alert, ProgressBar } from "@proxyshard/shardx-ui-kit";
import { DownloadIcon } from "../../shared/icons";
import { useT } from "../../shared/i18n";
import { toast } from "../../shared/model/toast";
import type { RtStatus, RtProgress } from "../../shared/types";

export function FirstRunGate({ children }: { children: ReactNode }) {
  const t = useT();
  // null = querying backend; true = reveal; false = show overlay.
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [prog, setProg] = useState<RtProgress | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // Bumped by the retry button to re-run the check from scratch.
  const [attempt, setAttempt] = useState(0);
  // Single in-flight install at a time.
  const installing = useRef(false);

  const fmt = (b: number) =>
    b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  useEffect(() => {
    let cancelled = false;
    let unProg: (() => void) | undefined;
    let unDone: (() => void) | undefined;

    // Plain-browser dev (vite without Tauri): no IPC — skip the gate so the
    // UI can be previewed; launch attempts will surface their own errors.
    if (!("__TAURI_INTERNALS__" in window)) {
      setInstalled(true);
      return;
    }

    (async () => {
      // A retry starts over: clear the previous failure before re-probing.
      setErr(null);

      // Subscribe BEFORE invoking so we don't miss the first event.
      unProg = await listen<RtProgress>("runtime:progress", (e) => {
        if (!cancelled) setProg(e.payload);
      });
      unDone = await listen("runtime:done", () => {
        if (!cancelled) { setProg(null); setInstalled(true); }
      });

      let status: RtStatus;
      try {
        status = await invoke<RtStatus>("runtime_status");
      } catch (e: any) {
        // Status could not be read (offline, blocked GitHub manifest, IPC
        // hiccup). This must NOT strand `installed` at null — that returns
        // null forever and the launcher renders a blank window. Let the user
        // in, exactly as the unsupported-platform branch below does; a launch
        // that really needs the engine raises its own error. A toast carries
        // the backend's own message so the cause is not silently swallowed.
        if (cancelled) return;
        console.error("runtime_status failed:", e);
        toast.err(t("firstRunGate.statusFailed"));
        setInstalled(true);
        return;
      }
      if (cancelled) return;

      // Unsupported platform: let the user in; launch will error if attempted.
      if (!status.spec) {
        setInstalled(true);
        return;
      }
      // Reveal only when the engine + fingerprints are installed AND up to
      // date. An available engine update (chromium version bump) falls through
      // to the install path below, which re-downloads the changed archives.
      if (status.installed && status.fingerprints_installed && !status.update_available) {
        setInstalled(true);
        return;
      }

      setInstalled(false);
      if (installing.current) return;
      installing.current = true;
      try {
        await invoke<RtStatus>("runtime_install", { force: false });
        if (!cancelled) setInstalled(true);
      } catch (e: any) {
        if (!cancelled) setErr(typeof e === "string" ? e : (e?.message ?? String(e)));
      } finally {
        installing.current = false;
      }
    })();

    return () => {
      cancelled = true;
      unProg?.();
      unDone?.();
    };
  }, [attempt]);

  // Still querying: show the setup screen rather than nothing, so the window
  // is never empty while the backend answers.
  if (installed === null) {
    return (
      <div className="fixed inset-0 z-1000 flex items-center justify-center bg-[var(--color-paper,#ffffff)] text-zinc-900 dark:text-white">
        <div className="w-[460px] px-9 py-8 text-center">
          <div className="mx-auto mb-5 grid size-16 place-items-center rounded-[24px] bg-[var(--color-surface-alt,#fafafa)] text-[var(--color-ink,#0a0a0a)] border border-[var(--color-hairline,#e5e5e5)] shadow-xs">
            <DownloadIcon className="size-8" />
          </div>
          <div className="mb-2 text-page-title">{t("firstRunGate.title")}</div>
          <div className="text-paragraph-xs text-zinc-500 dark:text-zinc-400">
            {t("firstRunGate.contactingCdn")}
          </div>
        </div>
      </div>
    );
  }
  if (installed) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-[var(--color-paper,#ffffff)] text-zinc-900 dark:text-white">
      <div className="w-[460px] px-9 py-8 text-center">
        <div className="mx-auto mb-5 grid size-16 place-items-center rounded-[24px] bg-[var(--color-surface-alt,#fafafa)] text-[var(--color-ink,#0a0a0a)] border border-[var(--color-hairline,#e5e5e5)] shadow-xs">
          <DownloadIcon className="size-8" />
        </div>
        <div className="mb-2 text-page-title">{t("firstRunGate.title")}</div>
        <div className="mb-6 text-paragraph-xs text-zinc-500 dark:text-zinc-400">
          {t("firstRunGate.downloadNote", {
            size: prog?.total ? fmt(prog.total) : "150 MB",
          })}
        </div>

        {prog && (
          <>
            <div className="mb-1.5 text-left text-paragraph-xs text-zinc-500 dark:text-zinc-400">
              {prog.label}:{" "}
              {prog.phase === "download"
                ? `${fmt(prog.received)} / ${fmt(prog.total)}  (${prog.percent}%)`
                : t("firstRunGate.extracting")}
            </div>
            <ProgressBar value={prog.percent} color="primary" />
          </>
        )}
        {!prog && !err && (
          <div className="text-paragraph-xs text-zinc-500 dark:text-zinc-400">{t("firstRunGate.contactingCdn")}</div>
        )}
        {err && (
          <>
            <Alert status="error" variant="light" className="mt-3 text-left">
              {err}
            </Alert>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="mt-4 cursor-pointer rounded-[10px] border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] px-4 py-2 text-paragraph-xs font-medium transition-colors hover:bg-[var(--color-canvas,#f5f5f5)]"
            >
              {t("firstRunGate.retry")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
