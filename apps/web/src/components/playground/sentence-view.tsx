import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  Loader2,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { INFINITE_EXERCISE_IDS } from "@acme/core/constants";

import type { TrainingSessionParams } from "~/types";
import AudioPlayButton2 from "~/components/AudioPlayButton";
import AudioPlayButton from "~/components/playground/audio-play-button";
import { useTrainingSession } from "~/providers/training-session-provider";
import { useUserSettings } from "~/providers/user-settings-provider";
import { api } from "~/trpc/react";
import { cn } from "~/utils";
import InterlinearView from "../InterlinearView";
import TrainingProgressBar from "../TrainingProgressBar";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import ToolBar from "./toolbar";
import { useTrainingSessionView } from "./training-session-view";

export function SentenceView() {
  const { sentences, setIsComplete } = useTrainingSessionView();
  const { trainingSession, updateTrainingSession } = useTrainingSession();
  const { languageCode } = useParams<TrainingSessionParams>();
  const [showTranslation, setShowTranslation] = useState(false);
  const { userSettings } = useUserSettings();

  const { sentence, nextSentence, previousSentence } = useMemo(
    () => ({
      sentence: sentences[trainingSession.sentenceIndex],
      previousSentence: sentences[trainingSession.sentenceIndex - 1],
      nextSentence: sentences[trainingSession.sentenceIndex + 1],
    }),
    [sentences, trainingSession.sentenceIndex],
  );

  const utils = api.useUtils();

  // NOTE: This query is just to get the sentence status if available. Do not want to call the query unnecessarily;
  const sentenceQuery = api.sentences.getSentence.useQuery(
    { sentenceId: sentence?.id ?? "" },
    { enabled: false },
  );

  const markWordKnownMut = api.words.markWordKnown.useMutation();

  const isInfiniteExercise = INFINITE_EXERCISE_IDS.includes(
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
      setIsComplete(true);
      return;
    }

    if (!nextSentence) {
      return;
    }
    const sentencesLeft = sentences.length - (nextSentence.index + 1);

    updateTrainingSession.mutate(
      {
        trainingSessionId: nextSentence.trainingSessionId,
        dto: {
          sentenceIndex: nextSentence.index,
        },
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
    updateTrainingSession,
    setIsComplete,
    isInfiniteExercise,
    trainingSession.status,
    trainingSession.id,
    generateNextSetOfSentencesMut,
  ]);

  const handlePrevious = useCallback(() => {
    if (!previousSentence) {
      return;
    }
    updateTrainingSession.mutate({
      trainingSessionId: previousSentence.trainingSessionId,
      dto: {
        sentenceIndex: previousSentence.index,
      },
    });
  }, [previousSentence, updateTrainingSession]);

  const handleMarkAllWordsKnownAndNext = useCallback(async () => {
    if (!sentence) {
      return;
    }
    try {
      const { words } = await utils.sentences.getSentence.fetch({
        sentenceId: sentence.id,
      });
      await Promise.all(
        words.map(async (word) => {
          await markWordKnownMut.mutateAsync({
            wordId: word.wordId,
            sessionId: trainingSession.id,
          });
        }),
      );
      words.forEach((word) => {
        void utils.words.getUserWord.invalidate({ wordId: word.wordId });
      });
      void utils.languages.getPracticeLanguage.invalidate({
        languageCode,
      });
      void utils.languages.getPracticeLanguages.invalidate();
      setIsComplete(true);
    } catch (error) {
      toast((error as Error).message);
    }
  }, [
    languageCode,
    markWordKnownMut,
    sentence,
    setIsComplete,
    trainingSession.id,
    utils.languages.getPracticeLanguage,
    utils.languages.getPracticeLanguages,
    utils.sentences.getSentence,
    utils.words.getUserWord,
  ]);

  return (
    <>
      <ToolBar>
        <TrainingProgressBar
          currentPage={trainingSession.sentenceIndex}
          onPageChange={(newIndex) => {
            updateTrainingSession.mutate({
              trainingSessionId: trainingSession.id,
              dto: {
                sentenceIndex: newIndex,
              },
            });
          }}
          className="w-full max-w-lg"
          sentences={sentences}
          tooltipText={`${trainingSession.sentenceIndex + 1}/${sentences.length}`}
        />
      </ToolBar>

      <div className="flex flex-1 overflow-hidden">
        <div className="md:p-2">
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

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto my-8 flex w-full max-w-screen-2xl flex-1 flex-col px-4 md:my-16 md:px-8">
            {sentence ? (
              <>
                <div className="mb-8 flex items-center justify-center gap-2 md:mb-8">
                  {sentenceQuery.data?.interlinearLineGenerationStatus ===
                  "success" ? (
                    <AudioPlayButton
                      text={sentence.sentence}
                      autoPlay={userSettings.autoPlayAudio}
                    />
                  ) : (
                    <>
                      <Skeleton className="h-14 w-14 rounded-full" />
                      <Skeleton className="h-10 w-14 rounded-full" />
                    </>
                  )}
                </div>

                <InterlinearView sentences={[sentence]} />

                {sentenceQuery.data?.interlinearLineGenerationStatus ===
                  "success" && (
                  <div className="pointer-events-none mt-16">
                    <div className="flex flex-wrap gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowTranslation(!showTranslation)}
                        className="text-muted-foreground"
                      >
                        {showTranslation
                          ? "Hide Translation"
                          : "Show Translation"}
                        <ChevronDownIcon
                          className={cn(
                            "-mr-1 ml-2 h-4 w-4 transition-transform duration-200",
                            {
                              "-rotate-180": showTranslation,
                            },
                          )}
                        />
                      </Button>
                      <Button
                        variant="outline"
                        className="text-muted-foreground"
                        onClick={handleMarkAllWordsKnownAndNext}
                      >
                        Mark all Words Known and Next
                        <ArrowRightIcon className="-mr-1 ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    {showTranslation && (
                      <div className="text-muted-foreground bg-muted/50 mt-2 flex gap-4 overflow-hidden rounded-lg p-2">
                        <AudioPlayButton2
                          value={sentence.translation}
                          variant="outline"
                        />
                        <div className="flex-1">
                          <p className="italic">{sentence.translation}</p>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground mt-2 h-fit px-0"
                            asChild
                          >
                            <Link
                              href={`https://translate.google.com/?sl=${trainingSession.languageCode}&tl=${userSettings.nativeLanguage}&text=${sentences.map((sent) => sent.sentence).join(" ")}&op=translate`}
                              target="_blank"
                              rel="nofollow noreferrer"
                            >
                              Google Translate
                              <ExternalLinkIcon className="-mr-1 ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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

        <div className="md:p-2">
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
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-muted-foreground flex h-full w-12 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                Generating More sentences
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </>
  );
}
