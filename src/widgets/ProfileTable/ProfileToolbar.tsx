import { useState } from "react";
import { Button } from "@proxyshard/shardx-ui-kit";
import { AddIcon } from "../../shared/icons";
import {
  BulkActionsBar,
  ImportProfilesButton,
  FromTemplateButton,
  NewProfileButton,
  ProfileFilterBar,
  BulkGeneratorModal,
} from "../../features/manage-profiles";
import { useT } from "../../shared/i18n";

export function ProfileToolbar() {
  const t = useT();
  const [showBulkGen, setShowBulkGen] = useState(false);

  return (
    <div className="flex items-center flex-none gap-2">
      <BulkActionsBar />
      <ProfileFilterBar />
      <Button
        variant="neutral"
        mode="stroke"
        size="small"
        leftIcon={<AddIcon className="size-4" />}
        onClick={() => setShowBulkGen(true)}
      >
        {t("profileToolbar.bulkGen")}
      </Button>
      <ImportProfilesButton />
      <FromTemplateButton />
      <NewProfileButton />

      {showBulkGen && (
        <BulkGeneratorModal
          open
          onClose={() => setShowBulkGen(false)}
        />
      )}
    </div>
  );
}
