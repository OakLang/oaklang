"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";

import StartTrainingDialog from "~/components/dialogs/start-training-dialog";
import { Button } from "~/components/ui/button";

export default function StartTrainingButton() {
  const [showStartTrainingDialog, setShowStartTrainingDialog] = useState(false);
  const t = useTranslations("App");

  return (
    <>
      <Button
        onClick={() => setShowStartTrainingDialog(!showStartTrainingDialog)}
      >
        {t("start-training")}
      </Button>
      <StartTrainingDialog
        open={showStartTrainingDialog}
        onOpenChange={setShowStartTrainingDialog}
      />
    </>
  );
}
