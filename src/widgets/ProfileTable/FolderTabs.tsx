import { useEffect, useRef } from "react";
import { cn } from "@proxyshard/shardx-ui-kit";
import { useContextMenu } from "../../shared/hooks/useContextMenu";
import { useT } from "../../shared/i18n";
import { useProfile, useFolders } from "../../entities/profile";

/* UI-kit "line" tab look with indigo active state */
const tabBase =
  "relative -mb-px flex flex-none cursor-pointer items-center gap-2 whitespace-nowrap border-0 border-b-2 bg-transparent px-3.5 py-2.5 text-[13px] transition-colors pointer-events-auto [&>*]:pointer-events-none";
const tabActive = "border-b-indigo-600 dark:border-b-indigo-400 text-[var(--color-ink,#0a0a0a)] font-semibold";
const tabIdle = "border-b-transparent text-[var(--color-mid-gray,#737373)] hover:text-[var(--color-ink,#0a0a0a)]";
const tabDrop = "bg-[var(--color-canvas,#f5f5f5)]! text-[var(--color-ink,#0a0a0a)]! outline outline-1 outline-dashed outline-indigo-500";
const badge = (active: boolean) =>
  cn(
    "rounded-[18px] px-2 py-0.5 text-[10px] font-semibold transition-colors",
    active
      ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25"
      : "bg-[var(--color-canvas,#f5f5f5)] text-[var(--color-mid-gray,#737373)] border border-[var(--color-hairline,#e5e5e5)]",
  );

const readDragId = (e: React.DragEvent) =>
  e.dataTransfer.getData("application/x-shardx-profile") || e.dataTransfer.getData("text/plain");

export function FolderTabs() {
  const t = useT();
  const profiles = useProfile((s) => s.profiles);
  const folder = useProfile((s) => s.folder);
  const dropTarget = useProfile((s) => s.dropTarget);
  const setFolder = useProfile((s) => s.setFolder);
  const setDropTarget = useProfile((s) => s.setDropTarget);
  const setProfileFolder = useProfile((s) => s.setProfileFolder);
  const setFolderModal = useProfile((s) => s.setFolderModal);
  const deleteFolder = useProfile((s) => s.deleteFolder);
  const folders = useFolders();
  const ctx = useContextMenu();

  // Native non-passive wheel handler turns vertical scroll into horizontal tab scroll.
  const folderTabsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = folderTabsRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth || e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Fall back to "all" when the active folder tab becomes empty.
  useEffect(() => {
    if (folder !== "all" && !folders.includes(folder)) setFolder("all");
  }, [folders, folder, setFolder]);

  return (
    <div
      className="flex min-w-0 overflow-x-auto border-b border-[var(--color-hairline,#e5e5e5)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      ref={folderTabsRef}
    >
      <button
        className={cn(tabBase, folder === "all" ? tabActive : tabIdle, dropTarget === "__all__" && tabDrop)}
        onClick={() => setFolder("all")}
        // Unconditional preventDefault on dragover is the *only* way HTML5 marks
        // the element as a valid drop target — the preventDefault itself must
        // fire on every event or `drop` never lands.
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (dropTarget !== "__all__") setDropTarget("__all__");
        }}
        onDragLeave={(e) => {
          // Ignore enter-into-child events: relatedTarget will be a descendant
          // of the button, so the drag is still over us.
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDropTarget(null);
          const id = readDragId(e);
          if (id) setProfileFolder(id, ""); // "" = unassign folder
        }}
      >
        {t("folderTabs.allTab")}<span className={badge(folder === "all")}>{profiles.length}</span>
      </button>
      {folders.map((f) => (
        <button
          key={f}
          className={cn(tabBase, folder === f ? tabActive : tabIdle, dropTarget === f && tabDrop)}
          onClick={() => setFolder(f)}
          title={t("folderTabs.folderTabHint")}
          onContextMenu={(e) =>
            ctx.open(e, [
              { label: t("folderTabs.deleteFolder"), onClick: () => deleteFolder(f), danger: true },
            ])
          }
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (dropTarget !== f) setDropTarget(f);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDropTarget(null);
            const id = readDragId(e);
            if (id) setProfileFolder(id, f);
          }}
        >
          {f}
          <span className={badge(folder === f)}>
            {profiles.filter((p) => p.folder === f).length}
          </span>
        </button>
      ))}
      <button
        className="flex-none cursor-pointer whitespace-nowrap border-0 bg-transparent px-3 py-2 text-base font-normal leading-none text-zinc-400 dark:text-zinc-500 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
        title={t("folderTabs.newFolder")}
        onClick={() => setFolderModal({ profileId: null })}
      >
        +
      </button>
      {ctx.node}
    </div>
  );
}
