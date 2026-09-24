import { Fragment, useState, type ReactNode } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button, cn } from "@proxyshard/shardx-ui-kit";
import { Topbar } from "../../shared/ui/Topbar";
import Badge from "../../shared/ui/Badge";
import { LockedIcon, StarOutlineIcon, ChevronDownIcon } from "../../shared/icons";
import { withUtm } from "../../shared/lib/utils";
import { useT } from "../../shared/i18n";
import data from "./patchlog.json";

/** The log is data, in patchlog.json; this module only draws it. */

type Block =
  | { type: "p" | "note"; text: string }
  | { type: "code"; text: string }
  | { type: "list"; items: string[] };

type Entry = {
  id: string;
  title: string;
  /** One line under the title: what it is, before any detail. */
  lead: string;
  tag?: string;
  /** Which half of the product changed: the engine, or the launcher. */
  scope?: "browser" | "launcher";
  locked?: boolean;
  blocks: Block[];
};

type Release = { version: string; date: string; entries: Entry[] };

const RELEASES = data.releases as Release[];
/** Newest release, and the one the picker starts on. */
const LATEST = RELEASES[0];

/** "new" is an addition, anything else reads as a correction. */
const tagColor = (tag: string) => (tag === "new" ? "success" : "primary");

/** Inline markup, deliberately tiny: `code`, **strong**, *emphasis*. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("`") && p.endsWith("`") && p.length > 2) {
          return (
            <code
              key={i}
              className="rounded bg-[var(--color-surface-alt,#fafafa)] dark:bg-zinc-800 px-1 py-0.5 font-mono text-[11px] text-zinc-900 dark:text-zinc-200"
            >
              {p.slice(1, -1)}
            </code>
          );
        }
        if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
          return (
            <strong key={i} className="text-zinc-900 dark:text-white">
              {p.slice(2, -2)}
            </strong>
          );
        }
        if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
          return <em key={i}>{p.slice(1, -1)}</em>;
        }
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        const spaced = i === 0 ? "" : "mt-2";
        if (b.type === "code") {
          return (
            <pre
              key={i}
              className={cn(
                "m-0 overflow-x-auto rounded-[14px] bg-[var(--color-surface-alt,#fafafa)] p-3.5 font-mono text-[12px] leading-relaxed text-zinc-800 dark:text-zinc-200 border border-[var(--color-hairline,#e5e5e5)]",
                i === 0 ? "" : "mt-2.5",
              )}
            >
              {b.text}
            </pre>
          );
        }
        if (b.type === "list") {
          return (
            <ul key={i} className={cn("m-0 flex list-none flex-col gap-1.5 p-0", spaced)}>
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-2 text-paragraph-xs text-zinc-600 dark:text-zinc-300">
                  <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                  <span>
                    <Rich text={it} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p
            key={i}
            className={cn(
              "m-0 text-paragraph-xs",
              b.type === "note" ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-600 dark:text-zinc-300",
              spaced,
            )}
          >
            <Rich text={b.text} />
          </p>
        );
      })}
    </>
  );
}

function ReleasePicker({
  value,
  onChange,
}: {
  value: Release;
  onChange: (r: Release) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        className="flex cursor-pointer items-center gap-2 rounded-[18px] bg-[var(--color-paper,#ffffff)] px-3.5 py-2 text-label-xs font-semibold text-zinc-900 dark:text-white border border-[var(--color-hairline,#e5e5e5)] shadow-xs transition-colors hover:bg-[var(--color-surface-alt,#fafafa)]"
        onClick={() => setOpen((v) => !v)}
      >
        <span>v{value.version}</span>
        {value === LATEST && (
          <Badge color="success" variant="filled" size="small">
            {t("patchlog.latestBadge")}
          </Badge>
        )}
        <span
          className={cn(
            "grid place-items-center text-zinc-400 transition-transform",
            open && "rotate-180",
          )}
        >
          <ChevronDownIcon className="size-4" />
        </span>
      </button>

      {open && (
        <>
          {/* Click anywhere else and the list goes away. */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1.5 min-w-[200px] overflow-hidden rounded-[18px] bg-[var(--color-paper,#ffffff)] p-1.5 shadow-[var(--shadow-subtle)] border border-[var(--color-hairline,#e5e5e5)]">
            {RELEASES.map((r) => (
              <button
                key={r.version}
                type="button"
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-3 rounded-[12px] border-0 px-3 py-2 text-left text-label-xs font-medium transition-colors",
                  r === value
                    ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold"
                    : "bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-[var(--color-surface-alt,#fafafa)]",
                )}
                onClick={() => {
                  onChange(r);
                  setOpen(false);
                }}
              >
                <span>v{r.version}</span>
                <span className="font-mono text-paragraph-xs text-zinc-500 dark:text-zinc-400">{r.date}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LockNotice() {
  const t = useT();
  return (
    <div className="mt-3 flex flex-col gap-2 rounded-[16px] bg-amber-500/10 border border-amber-500/25 p-3.5">
      <div className="flex items-center gap-2 text-label-xs font-semibold text-amber-700 dark:text-amber-300">
        <span className="text-amber-500">
          <LockedIcon className="size-[16px]" />
        </span>
        <span>
          {t("patchlog.shipsAtStars", {
            n: data.starsRequired.toLocaleString("en-US"),
          })}
        </span>
      </div>
      <p className="m-0 text-paragraph-xs text-zinc-600 dark:text-zinc-300">
        {t("patchlog.lockExplainer")}
      </p>
      <div>
        <Button
          size="small"
          variant="neutral"
          mode="stroke"
          onClick={() => openUrl(withUtm(data.repoUrl)).catch(() => {})}
        >
          <span className="mr-1.5 inline-grid place-items-center align-middle">
            <StarOutlineIcon className="size-4 text-amber-500" />
          </span>
          {t("patchlog.starRepo")}
        </Button>
      </div>
    </div>
  );
}

function EntryCard({ entry }: { entry: Entry }): ReactNode {
  const t = useT();
  return (
    <article className="rounded-[24px] bg-[var(--color-paper,#ffffff)] p-5 border border-[var(--color-hairline,#e5e5e5)] shadow-[var(--shadow-subtle)]">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="m-0 text-label-md font-semibold text-zinc-900 dark:text-white">{entry.title}</h2>
        <span className="rounded-[6px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-[0.06em]">
          {entry.scope === "launcher"
            ? t("patchlog.scopeLauncher")
            : t("patchlog.scopeBrowser")}
        </span>
        {entry.tag && (
          <Badge color={tagColor(entry.tag)} variant="filled" size="small">
            {entry.tag}
          </Badge>
        )}
        {entry.locked && (
          <Badge color="warning" variant="filled" size="small">
            {t("patchlog.lockedBadge")}
          </Badge>
        )}
      </div>
      {/* The one serif accent the system allows: release leads read as
          editorial pull quotes, thin weight against the industrial frame. */}
      <p
        className="m-0 mb-3 mt-2 max-w-[80ch] text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-200"
      >
        {entry.lead}
      </p>
      <div className="max-w-[80ch]">
        <Blocks blocks={entry.blocks} />
      </div>
      {entry.locked && <LockNotice />}
    </article>
  );
}

export function PatchLogPage() {
  const t = useT();
  const [release, setRelease] = useState<Release>(LATEST);

  return (
    <section className="flex flex-col">
      <Topbar
        crumbs={[t("patchlog.crumbSystem"), t("patchlog.crumbPatchLog")]}
        search=""
        onSearch={() => {}}
      />

      <div className="mb-1.5 flex items-start justify-between gap-4">
        <h1 className="m-0 text-page-title text-zinc-900 dark:text-white">{t("patchlog.title")}</h1>
        <ReleasePicker value={release} onChange={setRelease} />
      </div>

      <p className="m-0 mb-3.5 max-w-[70ch] text-paragraph-xs text-zinc-500 dark:text-zinc-400">
        {t("patchlog.introPart1")}
        <strong>{t("patchlog.introBrowserWord")}</strong>
        {t("patchlog.introPart2")}
        <strong>{t("patchlog.introLauncherWord")}</strong>
        {t("patchlog.introPart3")}
      </p>

      <div className="mb-3.5 flex items-center gap-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-300">
          v{release.version} · {release.date}
        </span>
        <span className="h-px flex-1 bg-[var(--color-hairline,#e5e5e5)]" />
        <span className="font-mono text-paragraph-xs text-zinc-500 dark:text-zinc-400">
          {release.entries.length === 1
            ? t("patchlog.changeCountOne", { n: release.entries.length })
            : t("patchlog.changeCountMany", { n: release.entries.length })}
        </span>
      </div>

      <div className="flex flex-col gap-3 pb-6">
        {release.entries.map((e) => (
          <EntryCard key={e.id} entry={e} />
        ))}
      </div>
    </section>
  );
}
