import { useEffect, useState } from "react";
import { Topbar } from "../../shared/ui/Topbar";
import { useCredentials, type Credential } from "../../entities/credentials";
import { useProfile } from "../../entities/profile";
import { VaultGateModal } from "../../widgets/Credentials/VaultGateModal";
import { VaultSecurityPanel } from "../../widgets/Credentials/VaultSecurityPanel";
import { CredentialsMetrics } from "../../widgets/Credentials/CredentialsMetrics";
import { CredentialsTable } from "../../widgets/Credentials/CredentialsTable";
import { CredentialModal } from "../../widgets/Credentials/CredentialModal";
import { BulkImportModal } from "../../widgets/Credentials/BulkImportModal";
import { AddIcon, UploadIcon, LockedIcon } from "../../shared/icons";
import { useT } from "../../shared/i18n";

export function CredentialsPage() {
  const t = useT();
  const init = useCredentials((s) => s.init);
  const status = useCredentials((s) => s.status);
  const lock = useCredentials((s) => s.lock);
  const initProfile = useProfile((s) => s.init);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCred, setEditingCred] = useState<Credential | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    // `status` starts at null, which is also the state right after a remount.
    // First tab visit decides everything: set up the master password or unlock
    // the existing store. Autofill from the profiles table hydrates the store
    // for its own badge, so the vault can already be unlocked here.
    void init();
    void initProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isUnlocked = status?.unlocked;

  return (
    <section className="flex flex-col">
      <Topbar
        crumbs={[t("sidebar.groupWorkspace"), t("sidebar.navCredentials")]}
        search=""
        onSearch={() => {}}
      />

      {status === null ? (
        <div className="flex min-h-[60vh] items-center justify-center text-[13px] text-[var(--color-mid-gray,#737373)]">
          {t("credentials.loading")}
        </div>
      ) : !isUnlocked ? (
        <VaultGateModal />
      ) : (
        <>
          <CredentialsMetrics />

          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div>
              <h1 className="m-0 text-page-title text-zinc-900 dark:text-white">
                {t("credentials.title")}
              </h1>
              <p className="mt-1 text-[13px] text-[var(--color-mid-gray,#737373)]">
                {t("credentials.subtitle")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkOpen(true)}
                className="flex cursor-pointer items-center gap-2 rounded-[18px] border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)] px-3.5 py-2 text-[13px] font-medium text-[var(--color-ink,#0a0a0a)] hover:bg-[var(--color-canvas,#f5f5f5)] shadow-xs transition-all"
              >
                <UploadIcon className="size-4" />
                <span>{t("credentials.bulkImport")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingCred(null);
                  setModalOpen(true);
                }}
                className="btn-accent flex cursor-pointer items-center gap-2 rounded-[18px] px-4 py-2 text-[13px] font-medium shadow-sm transition-all"
              >
                <AddIcon className="size-4" />
                <span>{t("credentials.addAccount")}</span>
              </button>

              <button
                type="button"
                onClick={() => lock()}
                className="flex cursor-pointer items-center gap-1.5 rounded-[18px] border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)] px-3 py-2 text-[12.5px] font-medium text-[var(--color-mid-gray,#737373)] hover:text-rose-600 hover:border-rose-500/30 hover:bg-rose-500/5 shadow-xs transition-all"
                title={t("credentials.lock")}
              >
                <LockedIcon className="size-3.5" />
                <span>{t("credentials.lock")}</span>
              </button>
            </div>
          </div>

          <CredentialsTable
            onEdit={(cred) => {
              setEditingCred(cred);
              setModalOpen(true);
            }}
          />

          {modalOpen && (
            <CredentialModal
              open={modalOpen}
              initial={editingCred}
              onClose={() => {
                setModalOpen(false);
                setEditingCred(null);
              }}
            />
          )}

          {bulkOpen && (
            <BulkImportModal
              open={bulkOpen}
              onClose={() => setBulkOpen(false)}
            />
          )}

          <VaultSecurityPanel />
        </>
      )}
    </section>
  );
}
