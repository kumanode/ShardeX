import { useEffect } from "react";
import { TitleBar } from "../widgets/TitleBar/TitleBar";
import { Sidebar } from "../widgets/Sidebar/Sidebar";
import { FirstRunGate } from "../widgets/FirstRunGate/FirstRunGate";
import { ToastHost } from "../widgets/ToastHost/ToastHost";
import { ConfirmHost } from "../widgets/ConfirmHost/ConfirmHost";
import { StarModal } from "../widgets/StarModal/StarModal";
import { HelperWatcher } from "../widgets/HelperWatcher";
import { WhatsNewGate } from "../widgets/WhatsNewGate";
import { BrowsersPage } from "../pages/browsers";
import { ProxiesPage } from "../pages/proxies";
import { FingerprintsPage } from "../pages/fingerprints";
import { ExtensionsPage } from "../pages/extensions";
import { BookmarksPage } from "../pages/bookmarks";
import { AutomationPage } from "../pages/automation";
import { CredentialsPage } from "../pages/credentials";
import { TrashPage } from "../pages/trash";
import { SettingsPage } from "../pages/settings";
import { PatchLogPage } from "../pages/patchlog";
import { useNav } from "../shared/model/navigation";
import { useLauncherWarning } from "../shared/hooks/useLauncherWarning";
import { trackSection } from "../shared/lib/analytics";
import { cn } from "@proxyshard/shardx-ui-kit";

export function App() {
  const section = useNav((s) => s.section);
  const sidebarCollapsed = useNav((s) => s.sidebarCollapsed);

  useEffect(() => { void trackSection(section); }, [section]);
  useLauncherWarning();

  return (
    <>
      <TitleBar />
      <HelperWatcher />
      <WhatsNewGate />
      <FirstRunGate>
        <div
          className={cn(
            "grid overflow-hidden min-w-0 transition-all duration-200",
            sidebarCollapsed
              ? "[grid-template-columns:68px_minmax(0,1fr)]"
              : "[grid-template-columns:240px_minmax(0,1fr)] [@media(min-width:1700px)]:[grid-template-columns:280px_minmax(0,1fr)]"
          )}
          style={{
            height: "100vh",
            paddingTop: "var(--titlebar-h)",
            background: "var(--surface-canvas, #f5f5f5)",
          }}
        >
          <Sidebar />
          <main className="min-w-0 overflow-y-auto px-4 py-4 md:px-7 md:py-6">
            {section === "browsers" && <BrowsersPage />}
            {(section === "proxies" || section === "proxyshard") && <ProxiesPage />}
            {section === "fingerprints" && <FingerprintsPage />}
            {section === "extensions" && <ExtensionsPage />}
            {section === "bookmarks" && <BookmarksPage />}
            {section === "automation" && <AutomationPage />}
            {section === "credentials" && <CredentialsPage />}
            {section === "trash" && <TrashPage />}
            {section === "patchlog" && <PatchLogPage />}
            {section === "settings" && <SettingsPage />}
          </main>
          <ToastHost />
          <ConfirmHost />
          <StarModal />
        </div>
      </FirstRunGate>
    </>
  );
}
