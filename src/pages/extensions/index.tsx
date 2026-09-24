import { useEffect, useMemo, useState } from "react";
import { Button, DialogModal } from "@proxyshard/shardx-ui-kit";
import { Topbar } from "../../shared/ui/Topbar";
import { useStoreChanged } from "../../shared/hooks/useStoreChanged";
import { AddIcon, DeleteIcon, FolderIcon, GlobeIcon, NavExtensionsIcon } from "../../shared/icons";
import { Field } from "../../shared/ui/Field";
import { useExtensions, type ExtensionEntry } from "../../entities/extension";
import { fmtBytes } from "../../shared/lib/utils";
import { useT } from "../../shared/i18n";

function Card({ e }: { e: ExtensionEntry }) {
  const t = useT();
  const remove = useExtensions((s) => s.remove);
  return (
    <article className="flex flex-col justify-between gap-3 rounded-[20px] bg-[var(--color-paper,#ffffff)] p-4 border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)] transition-all hover:bg-[var(--color-surface-alt,#fafafa)] hover:shadow-md">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start gap-3">
          {e.icon ? (
            <img src={e.icon} alt="" className="size-10 shrink-0 rounded-lg object-contain" />
          ) : (
            <div className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <NavExtensionsIcon className="size-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="m-0 truncate text-label-xs font-semibold text-zinc-900 dark:text-white" title={e.name}>{e.name}</h3>
            <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
              {e.version && <span>v{e.version}</span>}
              <span>·</span>
              <span>{fmtBytes(e.size_bytes)}</span>
            </div>
          </div>
        </div>
        <p className="m-0 line-clamp-3 min-h-[2.4em] text-paragraph-xs text-zinc-600 dark:text-zinc-300">
          {e.description || <span className="text-zinc-400 dark:text-zinc-500">{t("extensions.noDescription")}</span>}
        </p>
      </div>
      <div className="flex justify-end pt-1 border-t border-[var(--color-hairline,#e5e5e5)]">
        <Button
          variant="error"
          mode="stroke"
          size="xsmall"
          className="hover:!bg-rose-500/10"
          leftIcon={<DeleteIcon className="size-4 text-rose-500" />}
          onClick={() => remove(e)}
        >
          {t("extensions.remove")}
        </Button>
      </div>
    </article>
  );
}

/** Add by address: a Web Store page, a bare id, or a .crx / .zip link. */
function LinkDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [url, setUrl] = useState("");
  const busy = useExtensions((s) => s.busy);
  const importUrl = useExtensions((s) => s.importUrl);
  return (
    <DialogModal
      open
      onClose={onClose}
      title={t("extensions.linkTitle")}
      confirmLabel={busy ? t("extensions.downloading") : t("extensions.download")}
      onConfirm={() => importUrl(url)}
      isLoading={busy}
      isDisabled={busy || !url.trim()}
      cancelLabel={t("extensions.cancel")}
      onCancel={onClose}
    >
      <div className="flex w-[460px] flex-col gap-3 py-4">
        <Field
          label={t("extensions.linkFieldLabel")}
          value={url}
          onChange={setUrl}
          placeholder="https://chromewebstore.google.com/detail/…"
          mono
        />
        <p className="m-0 text-paragraph-xs text-zinc-500 dark:text-zinc-400">
          {t("extensions.linkHelp")}
        </p>
      </div>
    </DialogModal>
  );
}

export function ExtensionsPage() {
  const t = useT();
  const init = useExtensions((s) => s.init);
  const items = useExtensions((s) => s.items);
  const busy = useExtensions((s) => s.busy);
  const search = useExtensions((s) => s.search);
  const setSearch = useExtensions((s) => s.setSearch);
  const importFiles = useExtensions((s) => s.importFiles);
  const importFolder = useExtensions((s) => s.importFolder);
  const linkOpen = useExtensions((s) => s.linkOpen);
  const setLinkOpen = useExtensions((s) => s.setLinkOpen);

  const reload = useExtensions((s) => s.reload);
  useEffect(() => { init(); }, [init]);
  // Pick up extensions added through the automation API.
  useStoreChanged(reload);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (e) => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <section className="flex flex-col">
      <Topbar crumbs={[t("extensions.crumbLibrary"), t("extensions.crumbExtensions")]} search={search} onSearch={setSearch} />

      <div className="mb-3.5 flex items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-page-title text-zinc-900 dark:text-white">{t("extensions.title")}</h1>
          <p className="m-0 mt-1 max-w-[70ch] text-paragraph-xs text-zinc-500 dark:text-zinc-400">
            {t("extensions.pageHelp")}
          </p>
        </div>
        <div className="flex flex-none items-center gap-2">
          <Button
            variant="neutral" mode="stroke" size="small" disabled={busy}
            leftIcon={<FolderIcon className="size-4" />}
            onClick={importFolder}
          >
            {t("extensions.unpackedFolder")}
          </Button>
          <Button
            variant="neutral" mode="stroke" size="small" disabled={busy}
            leftIcon={<GlobeIcon className="size-4" />}
            onClick={() => setLinkOpen(true)}
          >
            {t("extensions.fromLink")}
          </Button>
          <Button
            variant="neutral" mode="filled" size="small" disabled={busy} isLoading={busy}
            className="!bg-[var(--color-ink,#0a0a0a)] !text-white dark:!bg-white dark:!text-black"
            leftIcon={<AddIcon className="size-4" />}
            onClick={importFiles}
          >
            {t("extensions.addFiles")}
          </Button>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 rounded-[24px] bg-[var(--color-paper,#ffffff)] px-6 py-14 text-center border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)]">
          <div className="mb-2 grid size-14 place-items-center rounded-[18px] bg-[var(--color-surface-alt,#fafafa)] text-[var(--color-ink,#0a0a0a)] border border-[var(--color-hairline,#e5e5e5)] shadow-xs">
            <NavExtensionsIcon className="size-7" />
          </div>
          <h3 className="m-0 text-label-sm font-semibold text-zinc-900 dark:text-white">
            {items.length === 0 ? t("extensions.emptyTitle") : t("extensions.noMatchTitle")}
          </h3>
          <p className="m-0 max-w-[420px] text-paragraph-sm text-zinc-500 dark:text-zinc-400">
            {t("extensions.emptyHelp")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 pb-6">
          {shown.map((e) => <Card key={e.id} e={e} />)}
        </div>
      )}

      {linkOpen && <LinkDialog onClose={() => setLinkOpen(false)} />}
    </section>
  );
}
