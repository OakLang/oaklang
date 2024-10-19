"use client";

import { useState } from "react";

import type { Word } from "@acme/db/schema";

import StartTrainingDialog from "~/components/dialogs/start-training-dialog";
import { Button } from "~/components/ui/button";

export default function StartLearningButton() {
  const [wordsList, setWordsList] = useState<Word[]>([]);
  const [showTrainigSessionDialog, setShowTrainigSessionDialog] =
    useState(false);

  return (
    <>
      <Button onClick={() => setShowTrainigSessionDialog(true)}>
        Start Learning
      </Button>

      <StartTrainingDialog
        open={showTrainigSessionDialog}
        onOpenChange={(open) => {
          setShowTrainigSessionDialog(open);
          if (!open) {
            setWordsList([]);
          }
        }}
        words={wordsList.map((word) => word.word)}
      />
    </>
  );
}
