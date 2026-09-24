import { Button } from "@proxyshard/shardx-ui-kit";
import {
  PinIconApp,
  EditIcon,
  CopyIcon,
  DeleteIcon,
  MoreIcon,
  PlayIcon,
  StopIcon,
} from "../../../shared/icons";
import { useProfile, type ProfileMeta } from "../../../entities/profile";
import { useT } from "../../../shared/i18n";

export function ProfileRowActions({ profile, onMore }: {
  profile: ProfileMeta;
  onMore: (e: React.MouseEvent) => void;
}) {
  const t = useT();
  const p = profile;
  const isRunning = useProfile((s) => !!s.running[p.id]);
  const isStarting = useProfile((s) => s.startBusy.has(p.id));
  const startStop = useProfile((s) => s.startStop);
  const togglePin = useProfile((s) => s.togglePin);
  const cloneProfile = useProfile((s) => s.cloneProfile);
  const remove = useProfile((s) => s.remove);
  const expand = useProfile((s) => s.expand);

  return (
    <div className="flex justify-end items-center gap-1.5">
      <Button
        variant={isRunning ? "error" : "neutral"}
        mode={isRunning ? "lighter" : "filled"}
        size="small"
        fullRadius
        className={
          isRunning
            ? "min-w-[92px] h-9 !bg-rose-500/10 hover:!bg-rose-500/20 !text-rose-600 dark:!text-rose-400 !border !border-rose-500/30 font-medium"
            : "min-w-[92px] h-9 !bg-[var(--color-ink,#0a0a0a)] dark:!bg-white !text-white dark:!text-black hover:opacity-90 font-medium shadow-xs"
        }
        leftIcon={
          isRunning
            ? <StopIcon className="size-4" />
            : <span className={isStarting ? "spin-icon inline-grid place-items-center" : "inline-grid place-items-center"}><PlayIcon className="size-4" /></span>
        }
        onClick={() => startStop(p)}
        disabled={!isRunning && isStarting}
        title={!isRunning && isStarting ? t("profileRowActions.startingTitle") : undefined}
      >
        {isRunning ? t("profileRowActions.stop") : isStarting ? t("profileRowActions.starting") : t("profileRowActions.start")}
      </Button>
      <Button
        variant="neutral"
        mode="stroke"
        size="small"
        onlyIcon
        onClick={() => togglePin(p)}
        title={p.pinned ? t("profileRowActions.unpin") : t("profileRowActions.pinToTop")}
        className={p.pinned ? "!text-[var(--color-ink,#0a0a0a)] dark:!text-white !bg-[var(--color-canvas,#f5f5f5)] !border-[var(--color-ink,#0a0a0a)] dark:!border-white" : ""}
        leftIcon={<PinIconApp className="size-[18px]" />}
      />
      <Button
        variant="neutral"
        mode="stroke"
        size="small"
        onlyIcon
        onClick={() => expand(p.id)}
        title={t("profileRowActions.edit")}
        leftIcon={<EditIcon className="size-[18px]" />}
      />
      <Button
        variant="neutral"
        mode="stroke"
        size="small"
        onlyIcon
        onClick={() => cloneProfile(p.id)}
        title={t("profileRowActions.clone")}
        leftIcon={<CopyIcon className="size-[18px]" />}
      />
      <Button
        variant="neutral"
        mode="stroke"
        size="small"
        onlyIcon
        onClick={() => remove(p.id)}
        title={t("profileRowActions.delete")}
        className="hover:!text-rose-600 dark:hover:!text-rose-400 hover:!border-rose-500/30 hover:!bg-rose-500/10"
        leftIcon={<DeleteIcon className="size-[18px]" />}
      />
      <Button
        variant="neutral"
        mode="stroke"
        size="small"
        onlyIcon
        onClick={onMore}
        title={t("profileRowActions.moreActions")}
        leftIcon={<MoreIcon className="size-[18px]" />}
      />
    </div>
  );
}
