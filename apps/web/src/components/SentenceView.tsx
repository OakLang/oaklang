import { useCallback, useMemo } from "react";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";

import type { Sentence, TrainingSession } from "@acme/db/schema";
import { INFINITE_EXERCISES } from "@acme/core/constants";

import AudioPlayButton from "~/app/app/[languageCode]/training/[trainingSessionId]/audio-play-button";
import { useChangeSentenceIndex } from "~/hooks/useUpdateTrainingSessionMutation";
import { api } from "~/trpc/react";
import InterlinearView from "./InterlinearView";
import ToolBar from "./ToolBar";
import TrainingProgressBar from "./TrainingProgressBar";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function SentenceView({
  sentences,
  trainingSession,
  onComplete,
}: {
  trainingSession: TrainingSession;
  sentences: Sentence[];
  onComplete: () => void;
}) {
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();

  const sentence = sentences[trainingSession.sentenceIndex];
  const previousSentence = sentences[trainingSession.sentenceIndex - 1];
  const nextSentence = sentences[trainingSession.sentenceIndex + 1];

  const utils = api.useUtils();
  const changeSentenceIndex = useChangeSentenceIndex();

  const isInfiniteExercise = INFINITE_EXERCISES.includes(
    trainingSession.exercise,
  );

  const shouldCompleteSession = useMemo(() => {
    return (
      trainingSession.status === "success" &&
      !isInfiniteExercise &&
      !nextSentence
    );
  }, [isInfiniteExercise, nextSentence, trainingSession.status]);

  const generateNextSetOfSentencesMut =
    api.trainingSessions.generateNextSetOfSentences.useMutation({
      onMutate: () => {
        utils.trainingSessions.getTrainingSession.setData(
          { trainingSessionId: trainingSession.id },
          (oldData) => (oldData ? { ...oldData, status: "idle" } : undefined),
        );
      },
      onSuccess: () => {
        void utils.trainingSessions.getTrainingSession.invalidate({
          trainingSessionId: trainingSession.id,
        });
      },
      onError: (error) => {
        toast(error.message);
      },
    });

  const handleNext = useCallback(() => {
    if (shouldCompleteSession) {
      onComplete();
      return;
    }

    if (!nextSentence) {
      return;
    }
    const sentencesLeft = sentences.length - (nextSentence.index + 1);

    changeSentenceIndex.mutate(
      {
        trainingSessionId: nextSentence.trainingSessionId,
        sentenceIndex: nextSentence.index,
      },
      {
        onSuccess: () => {
          if (
            isInfiniteExercise &&
            sentencesLeft <= 3 &&
            trainingSession.status !== "pending" &&
            trainingSession.status !== "idle"
          ) {
            generateNextSetOfSentencesMut.mutate({
              trainingSessionId: trainingSession.id,
            });
          }
        },
      },
    );
  }, [
    shouldCompleteSession,
    nextSentence,
    sentences.length,
    trainingSession.status,
    trainingSession.id,
    isInfiniteExercise,
    changeSentenceIndex,
    onComplete,
    generateNextSetOfSentencesMut,
  ]);

  const handlePrevious = useCallback(() => {
    if (!previousSentence) {
      return;
    }
    changeSentenceIndex.mutate({
      trainingSessionId: previousSentence.trainingSessionId,
      sentenceIndex: previousSentence.index,
    });
  }, [changeSentenceIndex, previousSentence]);

  return (
    <>
      <ToolBar trainingSession={trainingSession}>
        <TrainingProgressBar
          currentPage={trainingSession.sentenceIndex}
          onPageChange={(newIndex) => {
            changeSentenceIndex.mutate({
              trainingSessionId: trainingSession.id,
              sentenceIndex: newIndex,
            });
          }}
          className="w-full max-w-lg"
          sentences={sentences}
          tooltipText={`${trainingSession.sentenceIndex + 1}/${sentences.length}`}
        />
      </ToolBar>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-1 gap-4 py-8 md:py-16">
          <div className="md:pl-2">
            {previousSentence ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-muted-foreground h-full w-12"
                    size="icon"
                    onClick={handlePrevious}
                  >
                    <ChevronLeftIcon className="h-8 w-8" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Previous Sentence</TooltipContent>
              </Tooltip>
            ) : (
              <div className="h-full w-12" />
            )}
          </div>

          <div className="flex flex-1 flex-col">
            <div className="mx-auto flex w-full max-w-screen-md flex-1 flex-col">
              <div className="flex flex-1 flex-col">
                {sentence ? (
                  <div className="mx-auto flex w-full max-w-screen-md flex-1 flex-col">
                    <div className="mb-8 flex items-center justify-center gap-2 md:mb-8">
                      <AudioPlayButton
                        text={sentence.sentence}
                        autoPlay={
                          userSettingsQuery.data?.autoPlayAudio === true
                        }
                      />
                    </div>
                    <InterlinearView
                      sentences={[sentence]}
                      onPreviousSentence={handlePrevious}
                      onNextSentence={handleNext}
                    />
                  </div>
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

          <div className="md:pr-2">
            {nextSentence ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-muted-foreground h-full w-12"
                    size="icon"
                    onClick={handleNext}
                    disabled={!sentence?.completedAt}
                  >
                    <ChevronRightIcon className="h-8 w-8" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Next Sentence</TooltipContent>
              </Tooltip>
            ) : shouldCompleteSession ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-muted-foreground h-full w-12"
                    size="icon"
                    onClick={handleNext}
                  >
                    <CheckIcon className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Finish</TooltipContent>
              </Tooltip>
            ) : (
              <div className="h-full w-12"></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
