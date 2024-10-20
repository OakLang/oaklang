import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import type { Sentence, TrainingSession } from "@acme/db/schema";
import { FINITE_EXERCISES } from "@acme/core/constants";

import AudioPlayButton from "~/app/app/[languageCode]/training/[trainingSessionId]/audio-play-button";
import { useChangeSentenceIndex } from "~/hooks/useUpdateTrainingSessionMutation";
import { useAppStore } from "~/store/app-store";
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

  const sentence = sentences.find(
    (sentence) => sentence.index === trainingSession.sentenceIndex,
  );
  const previousSentence = sentences.find(
    (sentence) => sentence.index === trainingSession.sentenceIndex - 1,
  );
  const nextSentence = sentences.find(
    (sentence) => sentence.index === trainingSession.sentenceIndex + 1,
  );

  const utils = api.useUtils();
  const interlinearLinesPromptTemplate = useAppStore(
    (state) => state.interlinearLinesPromptTemplate,
  );
  const [fetchingNextSentence, setFetchingNextSentence] = useState(false);
  const [fetchingPreviousSentence, setFetchingPreviousSentence] =
    useState(false);
  const changeSentenceIndex = useChangeSentenceIndex();

  const completedAllSentences = useMemo(() => {
    return FINITE_EXERCISES.includes(trainingSession.exercise) && !nextSentence;
  }, [nextSentence, trainingSession.exercise]);

  const handleNext = useCallback(() => {
    if (completedAllSentences) {
      onComplete();
      return;
    }

    if (!nextSentence) {
      return;
    }

    changeSentenceIndex.mutate({
      trainingSessionId: nextSentence.trainingSessionId,
      sentenceIndex: nextSentence.index,
    });
  }, [changeSentenceIndex, completedAllSentences, nextSentence, onComplete]);

  const handlePrevious = useCallback(() => {
    if (!previousSentence) {
      return;
    }
    changeSentenceIndex.mutate({
      trainingSessionId: previousSentence.trainingSessionId,
      sentenceIndex: previousSentence.index,
    });
  }, [changeSentenceIndex, previousSentence]);

  useEffect(() => {
    if (nextSentence?.id) {
      const fetchSentence = async () => {
        try {
          setFetchingNextSentence(true);
          await utils.sentences.getSentenceWords.ensureData({
            promptTemplate: interlinearLinesPromptTemplate,
            sentenceId: nextSentence.id,
          });
        } catch (error) {
          /* empty */
        } finally {
          setFetchingNextSentence(false);
        }
      };
      void fetchSentence();
    }
  }, [
    interlinearLinesPromptTemplate,
    nextSentence?.id,
    utils.sentences.getSentenceWords,
  ]);

  useEffect(() => {
    if (previousSentence?.id) {
      const fetchSentence = async () => {
        try {
          setFetchingPreviousSentence(true);
          await utils.sentences.getSentenceWords.ensureData({
            promptTemplate: interlinearLinesPromptTemplate,
            sentenceId: previousSentence.id,
          });
        } catch (error) {
          /* empty */
        } finally {
          setFetchingPreviousSentence(false);
        }
      };
      void fetchSentence();
    }
  }, [
    interlinearLinesPromptTemplate,
    previousSentence?.id,
    utils.sentences.getSentenceWords,
  ]);

  if (!sentence) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground text-center">
            Sentence not found!
          </p>
        </div>
      </div>
    );
  }

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
          pages={sentences.map((item) => ({
            index: item.index,
            completed: !!item.completedAt,
          }))}
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
                    disabled={fetchingPreviousSentence}
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
                <div className="mx-auto flex w-full max-w-screen-md flex-1 flex-col">
                  <div className="mb-8 flex items-center justify-center gap-2 md:mb-8">
                    <AudioPlayButton
                      text={sentence.sentence}
                      autoPlay={userSettingsQuery.data?.autoPlayAudio === true}
                    />
                  </div>
                  <InterlinearView
                    sentences={[sentence]}
                    onPreviousSentence={handlePrevious}
                    onNextSentence={handleNext}
                  />
                </div>
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
                    disabled={fetchingNextSentence}
                  >
                    <ChevronRightIcon className="h-8 w-8" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Next Sentence</TooltipContent>
              </Tooltip>
            ) : completedAllSentences ? (
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
