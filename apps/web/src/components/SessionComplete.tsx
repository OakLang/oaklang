import { useState } from "react";
import { ChevronLeftIcon } from "lucide-react";

import type { TrainingSession } from "@acme/db/schema";

import { api } from "~/trpc/react";
import StartTrainingDialog from "./dialogs/start-training-dialog";
import RenderQueryResult from "./RenderQueryResult";
import ToolBar from "./ToolBar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function SessionComplete({
  onBack,
  trainingSession,
}: {
  trainingSession: TrainingSession;
  onBack: () => void;
}) {
  const [showTrainigSessionDialog, setShowTrainigSessionDialog] =
    useState(false);
  const knownWordsQuery =
    api.trainingSessions.getAllKnownWordsFromSession.useQuery({
      trainingSessionId: trainingSession.id,
    });

  return (
    <>
      <ToolBar trainingSession={trainingSession} />

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-1 gap-4 py-8 md:py-16">
          <div className="md:pl-2">
            <Button
              variant="ghost"
              className="text-muted-foreground h-full w-12"
              size="icon"
              onClick={onBack}
            >
              <ChevronLeftIcon className="h-8 w-8" />
            </Button>
          </div>

          <div className="flex flex-1 flex-col">
            <div className="mx-auto flex w-full max-w-screen-md flex-1 flex-col">
              <p className="text-2xl font-semibold">YAY! Session complete!</p>

              <RenderQueryResult query={knownWordsQuery}>
                {(query) => {
                  if (query.data.length === 0) {
                    return null;
                  }

                  return (
                    <div className="my-16 space-y-4">
                      <p className="text-lg font-medium">
                        You have added {query.data.length} known words
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {query.data.map((word) => (
                          <Badge key={word.id} variant="outline">
                            {word.word}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                }}
              </RenderQueryResult>

              <div className="my-16 space-y-4">
                <Button onClick={() => setShowTrainigSessionDialog(true)}>
                  Start a new Session
                </Button>

                <StartTrainingDialog
                  open={showTrainigSessionDialog}
                  onOpenChange={setShowTrainigSessionDialog}
                />
              </div>
            </div>
          </div>

          <div className="md:pr-2">
            <div className="h-full w-12"></div>
          </div>
        </div>
      </div>
    </>
  );
}
