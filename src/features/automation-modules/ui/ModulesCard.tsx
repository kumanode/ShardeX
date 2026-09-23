import { useCallback, useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { openPath } from "@tauri-apps/plugin-opener";
import { Button } from "@proxyshard/shardx-ui-kit";
import {
  automationList,
  automationModuleGrant,
  automationModuleInstall,
  automationModulePermissions,
  automationModuleRemove,
  automationModules,
  automationModulesDir,
  type ModuleInfo,
  type ModulePermissions,
} from "../../../entities/automation";
import { AddIcon, DeleteIcon, FolderIcon } from "../../../shared/icons";
import { useT } from "../../../shared/i18n";
import { toast } from "../../../shared/model/toast";

/** What one module asked to be allowed to call, and the operator's answer.
 *
 *  A module may call nothing until this says otherwise — including one that
 *  asks for nothing, which is every module written before calling existed. */
function Permissions({ module: m }: { module: ModuleInfo }) {
  const t = useT();
  const [perm, setPerm] = useState<ModulePermissions | null>(null);
  const [flows, setFlows] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    automationModulePermissions(m.id).then(setPerm).catch(() => {});
    automationList()
      .then((ps) => setFlows(ps.map((p) => ({ id: p.id, name: p.name }))))
      .catch(() => {});
  }, [m.id]);

  if (!perm) return null;

  const wantedFlows = flows.filter((f) => perm.asks.flows.includes(f.name));
  const grantedM = new Set(perm.granted.call_modules);
  const grantedF = new Set(perm.granted.call_flows);

  const save = async (modules: string[], ids: string[]) => {
    setSaving(true);
    try {
      await automationModuleGrant(m.id, modules, ids);
      setPerm(await automationModulePermissions(m.id));
    } catch (e) {
      toast.err(String(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (id: string) => {
    const next = new Set(grantedM);
    next.has(id) ? next.delete(id) : next.add(id);
    save([...next], [...grantedF]);
  };
  const toggleFlow = (id: string) => {
    const next = new Set(grantedF);
    next.has(id) ? next.delete(id) : next.add(id);
    save([...grantedM], [...next]);
  };

  const asked = perm.asks.modules.length + perm.asks.flows.length;
  const reads =
    perm.asks.vars.length > 0
      ? t("modulesCard.readsVars", { vars: perm.asks.vars.join(", ") })
      : t("modulesCard.readsOwnVars");

  return (
    <div className="col-span-3 mt-1.5 rounded-[14px] bg-[var(--color-surface-alt,#fafafa)] border border-[var(--color-hairline,#e5e5e5)] px-3.5 py-2.5">
      <div className="text-paragraph-xs font-medium text-zinc-500 dark:text-zinc-400">{reads}</div>
      {asked === 0 ? null : (
      <div className="mt-1 text-paragraph-xs text-zinc-700 dark:text-zinc-300">
        {t("modulesCard.wantsToCall")}{perm.asks.reason ? `: ${perm.asks.reason}` : ""}
      </div>
      )}
      <div className="mt-1.5 flex flex-wrap gap-1.5 empty:hidden">
        {perm.asks.modules.map((id) => (
          <button
            key={`m-${id}`}
            disabled={saving}
            onClick={() => toggleModule(id)}
            className={`rounded-full px-2.5 py-1 text-paragraph-xs font-mono font-medium border transition-colors ${
              grantedM.has(id)
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-[var(--color-paper,#ffffff)] text-zinc-500 dark:text-zinc-400 border-[var(--color-hairline,#e5e5e5)]"
            }`}
          >
            {t("modulesCard.moduleChip", { id })}
          </button>
        ))}
        {perm.asks.flows.map((name) => {
          const found = wantedFlows.find((f) => f.name === name);
          return (
            <button
              key={`f-${name}`}
              disabled={saving || !found}
              onClick={() => found && toggleFlow(found.id)}
              title={found ? undefined : t("modulesCard.flowMissing")}
              className={`rounded-full px-2.5 py-1 text-paragraph-xs font-mono font-medium border transition-colors ${
                found && grantedF.has(found.id)
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-[var(--color-paper,#ffffff)] text-zinc-500 dark:text-zinc-400 border-[var(--color-hairline,#e5e5e5)]"
              }`}
            >
              {t("modulesCard.flowChip", { name })}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Modules an operator wrote themselves. Their blocks appear in the step
 *  library beside the built-in ones; this is where they get in and out. */
export function ModulesCard() {
  const t = useT();
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(() => {
    automationModules().then(setModules).catch(() => {});
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const add = async () => {
    const path = await open({
      title: t("modulesCard.pickerTitle"),
      filters: [{ name: t("modulesCard.pickerFilter"), extensions: ["wasm"] }],
    });
    if (typeof path !== "string") return;
    setBusy("+");
    try {
      const m = await automationModuleInstall(path);
      reload();
      toast.ok(
        m.blocks.length === 0
          ? t("modulesCard.addedNoSteps", { name: m.name })
          : m.blocks.length === 1
            ? t("modulesCard.addedOneStep", { name: m.name })
            : t("modulesCard.addedSteps", { name: m.name, n: m.blocks.length }),
      );
    } catch (e) {
      toast.err(String(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (m: ModuleInfo) => {
    setBusy(m.id);
    try {
      await automationModuleRemove(m.id);
      reload();
      // Nothing rewrites the projects that used it, so say so plainly.
      toast.ok(t("modulesCard.removed", { name: m.name }));
    } catch (e) {
      toast.err(String(e));
    } finally {
      setBusy(null);
    }
  };

  const openFolder = async () => {
    try {
      await openPath(await automationModulesDir());
    } catch {
      toast.err(t("modulesCard.folderOpenFailed"));
    }
  };

  return (
    <div className="mt-5 overflow-hidden rounded-[24px] bg-[var(--color-paper,#ffffff)] border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)]">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--color-hairline,#e5e5e5)] bg-[var(--color-surface-alt,#fafafa)] px-5 py-3.5">
        <div>
          <h2 className="m-0 text-label-sm font-semibold text-zinc-900 dark:text-white">{t("modulesCard.title")}</h2>
          <p className="m-0 mt-0.5 max-w-[80ch] text-paragraph-xs text-zinc-500 dark:text-zinc-400">
            {t("modulesCard.description")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="neutral" mode="stroke" size="small"
            leftIcon={<FolderIcon className="size-4" />}
            onClick={openFolder}
          >
            {t("modulesCard.folderButton")}
          </Button>
          <Button
            variant="primary" mode="filled" size="small"
            isLoading={busy === "+"}
            leftIcon={<AddIcon className="size-4" />}
            onClick={add}
          >
            {t("modulesCard.addButton")}
          </Button>
        </div>
      </div>

      {modules.length === 0 ? (
        <p className="m-0 px-4 py-8 text-center text-paragraph-sm text-zinc-500 dark:text-zinc-400">
          {t("modulesCard.emptyState")}
        </p>
      ) : (
        modules.map((m) => (
          <div
            key={m.id}
            className="grid grid-cols-[1fr_180px_60px] items-center gap-3 border-b border-[var(--color-hairline,#e5e5e5)] px-5 py-3 last:border-b-0 hover:bg-[var(--color-surface-alt,#fafafa)] transition-colors"
          >
            <div className="min-w-0">
              <div className="truncate text-label-sm font-semibold text-zinc-900 dark:text-white">{m.name}</div>
              <div className="truncate font-mono text-paragraph-xs text-zinc-500 dark:text-zinc-400">{m.path}</div>
            </div>
            <div className="text-paragraph-xs">
              {m.error ? (
                <span className="text-warning-base">{m.error}</span>
              ) : (
                <span className="font-mono text-zinc-700 dark:text-zinc-300 font-medium">
                  {m.blocks.length === 1
                    ? t("modulesCard.stepCountOne")
                    : t("modulesCard.stepCount", { n: m.blocks.length })}
                </span>
              )}
            </div>
            <div className="flex items-center justify-end">
              <Button
                variant="error" mode="stroke" size="small" onlyIcon className="h-9 w-9"
                disabled={busy === m.id}
                leftIcon={<DeleteIcon className="size-[18px]" />}
                onClick={() => remove(m)}
              />
            </div>
            <Permissions module={m} />
          </div>
        ))
      )}
    </div>
  );
}
