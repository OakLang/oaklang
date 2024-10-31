"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";

import StartTrainingDialog from "~/components/dialogs/start-training-dialog";
import { Button } from "~/components/ui/button";

export default function StartLearningButton() {
  const [showTrainigSessionDialog, setShowTrainigSessionDialog] =
    useState(false);

  return (
    <>
      <Button onClick={() => setShowTrainigSessionDialog(true)}>
        <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
        Start Learning
      </Button>

      <StartTrainingDialog
        open={showTrainigSessionDialog}
        onOpenChange={setShowTrainigSessionDialog}
      />
    </>
  );
}
