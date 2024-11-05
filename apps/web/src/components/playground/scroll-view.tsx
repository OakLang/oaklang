"use client";

import { useMemo } from "react";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";

import { useTrainingSession } from "~/providers/training-session-provider";
import InterlinearLineView from "../interlinear-line/interlinear-line-view";
import { Button } from "../ui/button";
import ToolBar from "./toolbar";
import { useTrainingSessionView } from "./training-session-view";

export default function ScrollView() {
  const { trainingSession } = useTrainingSession();
  const { sentences, setIsComplete } = useTrainingSessionView();

  const hasUncompleteSentence = useMemo(
    () => !!sentences.find((sentence) => !sentence.completedAt),
    [sentences],
  );

  return (
    <>
      <ToolBar />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex-col overflow-y-auto">
          <div className="mx-auto my-8 flex max-w-screen-2xl flex-col px-4 md:my-16 md:px-8">
            {sentences.length > 0 ? (
              <>
                <InterlinearLineView sentences={sentences} />
                <div className="mt-16 flex items-center justify-center gap-2">
                  <Button
                    onClick={() => setIsComplete(true)}
                    disabled={hasUncompleteSentence}
                  >
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
