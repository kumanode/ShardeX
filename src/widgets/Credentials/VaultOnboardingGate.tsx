import { useEffect, useState, type ReactNode } from "react";
import { useCredentials } from "../../entities/credentials";
import { VaultGateModal } from "./VaultGateModal";

const DISMISS_KEY = "shardx-vault-onboarding-dismissed";

function readDismissed(): boolean {
  try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
}

/**
 * First-run onboarding gate for the credential vault.
 *
 * On mount (after the runtime FirstRunGate has cleared):
 *  - If vault is already configured → renders children immediately.
 *  - If user dismissed before → renders children immediately.
 *  - Otherwise → renders a full-screen setup wizard overlay on top of children.
 *
 * The overlay is rendered *on top of* children (not replacing them) so that
 * ToastHost and other global singletons remain mounted.
 */
export function VaultOnboardingGate({ children }: { children: ReactNode }) {
  const checkStatus = useCredentials((s) => s.checkStatus);
  const init = useCredentials((s) => s.init);

  // null = still checking, false = hide, true = show wizard
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    // Plain-browser dev (no Tauri IPC): skip the gate entirely.
    if (!("__TAURI_INTERNALS__" in window)) {
      setShow(false);
      return;
    }
    if (readDismissed()) {
      setShow(false);
      void init();
      return;
    }
    (async () => {
      try {
        const st = await checkStatus();
        if (st.configured) {
          setShow(false);
          await init();
        } else {
          setShow(true);
        }
      } catch {
        // IPC error: let the app through; credentials page handles its own gate.
        setShow(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
    setShow(false);
    void init();
  };

  const done = () => {
    setShow(false);
    void init();
  };

  return (
    <>
      {children}
      {show === true && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4"
          style={{ background: "var(--surface-canvas, #f5f5f5)" }}
        >
          <VaultGateModal variant="onboarding" onSkip={dismiss} onDone={done} />
        </div>
      )}
    </>
  );
}
