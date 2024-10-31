"use client";

import { useMemo } from "react";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";

import type { Sentence, TrainingSession } from "@acme/db/schema";

import InterlinearView from "./InterlinearView";
import ToolBar from "./ToolBar";
import { Button } from "./ui/button";

export default function ScrollView({
  sentences,
  onComplete,
  trainingSession,
}: {
  sentences: Sentence[];
  onComplete: () => void;
  trainingSession: TrainingSession;
}) {
  const hasUncompleteSentence = useMemo(
    () => !!sentences.find((sentence) => !sentence.completedAt),
    [sentences],
  );

  return (
    <>
      <ToolBar trainingSession={trainingSession}></ToolBar>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex-col overflow-y-auto">
          <div className="mx-auto my-8 flex max-w-screen-2xl flex-col px-4 md:my-16 md:px-8">
            {sentences.length > 0 ? (
              <>
                <InterlinearView sentences={sentences} />
                <div className="mt-16 flex items-center justify-center gap-2">
                  <Button onClick={onComplete} disabled={hasUncompleteSentence}>
                    Complete
                    <ArrowRightIcon className="-mr-1 ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : trainingSession.status === "idle" ||
              trainingSession.status === "pending" ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-4">
                  <Loader2Icon className="h-6 w-6 animate-spin" />
                  <p className="text-muted-foreground text-center">
                    Generating Sentences...
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-4">
                  <p className="text-muted-foreground text-center">
                    Sentence not found!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
