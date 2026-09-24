import { Button } from "@proxyshard/shardx-ui-kit";
import { AddIcon } from "../../../shared/icons";
import { useProfile } from "../../../entities/profile";
import { useT } from "../../../shared/i18n";

export function NewProfileButton() {
  const t = useT();
  const newProfile = useProfile((s) => s.newProfile);
  return (
    <Button
      variant="primary"
      mode="filled"
      size="small"
      leftIcon={<AddIcon className="size-4" />}
      onClick={newProfile}
      className="!bg-[var(--color-ink,#0a0a0a)] hover:!bg-[var(--color-ink-soft,#171717)] !text-[var(--color-paper,#ffffff)] dark:!bg-[var(--color-paper,#ffffff)] dark:!text-[var(--color-ink,#0a0a0a)] dark:hover:!bg-zinc-200 font-medium !rounded-[18px]"
    >
      {t("newProfileButton.label")}
    </Button>
  );
}
