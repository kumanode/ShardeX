import { useEffect, useState } from "react";
import { Button } from "@proxyshard/shardx-ui-kit";
import { Topbar } from "../../shared/ui/Topbar";
import {
  AddIcon,
  CopyIcon,
  UploadIcon,
  DeleteIcon,
  NavAutomationIcon,
} from "../../shared/icons";
import { fmtTs } from "../../shared/lib/utils";
import { useStoreChanged } from "../../shared/hooks/useStoreChanged";
import { automationImport, useAutomation, type Bundle } from "../../entities/automation";
import { toast } from "../../shared/lib/toast";
import { ProjectEditor } from "./ProjectEditor";
import { ModulesCard } from "../../features/automation-modules";
import { useT } from "../../shared/i18n";

export function AutomationPage() {
  const t = useT();
  const init = useAutomation((s) => s.init);
  const status = useAutomation((s) => s.status);
  const available = useAutomation((s) => s.available);
  const projects = useAutomation((s) => s.projects);
  const openId = useAutomation((s) => s.openId);
  const busy = useAutomation((s) => s.busy);
  const open = useAutomation((s) => s.open);
  const create = useAutomation((s) => s.create);
  const remove = useAutomation((s) => s.remove);
  const duplicate = useAutomation((s) => s.duplicate);
  const reload = useAutomation((s) => s.reload);

  const [name, setName] = useState("");
  const crumbs = [t("automation.crumbWorkspace"), t("automation.crumbAutomation")];

  useEffect(() => { init(); }, [init]);
  // A project created or removed through the HTTP API or MCP writes straight
  // to disk; without this the list only catches up on restart.
  useStoreChanged(reload);

  if (status === "ready" && !available) {
    return (
      <section className="flex flex-col">
        <Topbar crumbs={crumbs} search="" onSearch={() => {}} />
        <div className="rounded-[24px] bg-[var(--color-paper,#ffffff)] p-8 text-center border border-[var(--color-hairline,#e5e5e5)]">
          <p className="m-0 text-paragraph-sm text-zinc-500 dark:text-zinc-400">
            {t("automation.notBuilt")}
          </p>
        </div>
      </section>
    );
  }

  if (openId) return <ProjectEditor />;

  const submit = async () => {
    const n = name.trim();
    if (!n) return;
    setName("");
    await create(n);
  };

  return (
    <section className="flex flex-col">
      <Topbar crumbs={crumbs} search="" onSearch={() => {}} />

      <div className="mb-3.5 flex items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-page-title text-zinc-900 dark:text-white">{t("automation.title")}</h1>
          <p className="m-0 mt-1 max-w-[70ch] text-paragraph-xs text-zinc-500 dark:text-zinc-400">
            {t("automation.intro")}
          </p>
        </div>
      </div>

      <div className="mb-3.5 flex items-center gap-2">
        <input
          className="h-9.5 w-[280px] rounded-[18px] bg-[var(--color-paper,#ffffff)] px-3.5 text-paragraph-sm text-zinc-900 dark:text-zinc-100 border border-[var(--color-hairline,#e5e5e5)] outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 shadow-sm"
          placeholder={t("automation.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <Button
          variant="primary" mode="filled" size="small"
          leftIcon={<AddIcon className="size-4" />}
          disabled={!name.trim()}
          onClick={submit}
        >
          {t("automation.create")}
        </Button>
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                const bundle = JSON.parse(await file.text()) as Bundle;
                const p = await automationImport(bundle);
                await init();
                open(p.id);
                const n = bundle.needs?.length ?? 0;
                toast.ok(
                  n === 0
                    ? t("automation.imported")
                    : n === 1
                      ? t("automation.importedSecret", { n })
                      : t("automation.importedSecrets", { n }),
                );
              } catch (err) { toast.err(String(err)); }
            }}
          />
          <span className="inline-flex h-9.5 items-center gap-1.5 rounded-[18px] px-3.5 text-label-sm font-medium text-zinc-700 dark:text-zinc-200 border border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-paper,#ffffff)] hover:bg-[var(--color-surface-alt,#fafafa)] cursor-pointer shadow-sm transition-colors">
            <UploadIcon className="size-4" />
            {t("automation.import")}
          </span>
        </label>
      </div>

      <div className="overflow-hidden rounded-[24px] bg-[var(--color-paper,#ffffff)] border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)]">
        {projects.length > 0 && (
          <div className="grid grid-cols-[1fr_100px_160px_140px] items-center gap-3 border-b border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-300">
            <div>{t("automation.colName")}</div>
            <div>{t("automation.colSteps")}</div>
            <div>{t("automation.colUpdated")}</div>
            <div />
          </div>
        )}

        {projects.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 px-4 py-12 text-center">
            <div className="grid size-12 place-items-center rounded-[18px] bg-amber-500/10 text-amber-500 border border-amber-500/25">
              <NavAutomationIcon className="size-6" />
            </div>
            <p className="m-0 text-paragraph-sm text-zinc-500 dark:text-zinc-400">
              {t("automation.emptyState")}
            </p>
          </div>
        ) : (
          projects.map((p) => (
            <div
              key={p.id}
              className="grid cursor-pointer grid-cols-[1fr_100px_160px_140px] items-center gap-3 border-b border-[var(--color-hairline,#e5e5e5)] px-4 py-2.5 last:border-b-0 hover:bg-[var(--color-surface-alt,#fafafa)] transition-colors"
              onClick={() => open(p.id)}
            >
              <div className="min-w-0">
                <div className="truncate text-label-sm font-semibold text-zinc-900 dark:text-white">{p.name}</div>
                {p.notes && (
                  <div className="truncate text-paragraph-xs text-zinc-500 dark:text-zinc-400">{p.notes}</div>
                )}
              </div>
              <div className="font-mono text-paragraph-sm font-semibold text-zinc-800 dark:text-zinc-200">{p.blocks.length}</div>
              <div className="font-mono text-paragraph-xs text-zinc-600 dark:text-zinc-300">{fmtTs(`@${p.updated_at}`)}</div>
              <div
                className="flex items-center justify-end gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="neutral" mode="stroke" size="small" onlyIcon className="h-9 w-9"
                  disabled={busy === p.id}
                  leftIcon={<CopyIcon className="size-[18px]" />}
                  onClick={() => duplicate(p)}
                />
                <Button
                  variant="error" mode="stroke" size="small" onlyIcon className="h-9 w-9"
                  disabled={busy === p.id}
                  leftIcon={<DeleteIcon className="size-[18px]" />}
                  onClick={() => remove(p)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <ModulesCard />
    </section>
  );
}
