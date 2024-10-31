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
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";

import type { Sentence, TrainingSession } from "@acme/db/schema";
import { INFINITE_EXERCISES } from "@acme/core/constants";

import type { TrainingSessionParams } from "~/types";
import AudioPlayButton from "~/app/app/[languageCode]/training/[trainingSessionId]/audio-play-button";
import AudioPlayButton2 from "~/components/AudioPlayButton";
import { useChangeSentenceIndex } from "~/hooks/useUpdateTrainingSessionMutation";
import { api } from "~/trpc/react";
import { cn } from "~/utils";
import InterlinearView from "./InterlinearView";
import ToolBar from "./ToolBar";
import TrainingProgressBar from "./TrainingProgressBar";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
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
  const { languageCode } = useParams<TrainingSessionParams>();
  const [showTranslation, setShowTranslation] = useState(false);
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();

  const sentence = sentences[trainingSession.sentenceIndex];
  const previousSentence = sentences[trainingSession.sentenceIndex - 1];
  const nextSentence = sentences[trainingSession.sentenceIndex + 1];

  const utils = api.useUtils();
  const changeSentenceIndex = useChangeSentenceIndex();

  const sentenceQuery = api.sentences.getSentence.useQuery(
    { sentenceId: sentence?.id ?? "" },
    {
      enabled: false,
    },
  );
  const markWordKnownMut = api.words.markWordKnown.useMutation();

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
      onComplete();
    } catch (error) {
      toast((error as Error).message);
    }
  }, [
    languageCode,
    markWordKnownMut,
    onComplete,
    sentence,
    trainingSession.id,
    utils.languages.getPracticeLanguage,
    utils.languages.getPracticeLanguages,
    utils.sentences.getSentence,
    utils.words.getUserWord,
  ]);

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
                      autoPlay={userSettingsQuery.data?.autoPlayAudio === true}
                    />
                  ) : (
                    <>
                      <Skeleton className="h-14 w-14 rounded-full" />
                      <Skeleton className="h-10 w-14 rounded-full" />
                    </>
                  )}
                </div>
                <InterlinearView sentences={[sentence]} />

                <div className="pointer-events-none mt-16">
                  <div className="flex flex-wrap gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowTranslation(!showTranslation)}
                      className="text-muted-foreground pointer-events-auto"
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
                      className="text-muted-foreground pointer-events-auto"
                      onClick={handleMarkAllWordsKnownAndNext}
                    >
                      Mark all Words Known and Next
                      <ArrowRightIcon className="-mr-1 ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  {showTranslation && (
                    <div className="text-muted-foreground bg-muted/50 pointer-events-auto mt-2 flex gap-4 overflow-hidden rounded-lg p-2">
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
                            href={`https://translate.google.com/?sl=${trainingSession.languageCode}&tl=${userSettingsQuery.data?.nativeLanguage}&text=${sentences.map((sent) => sent.sentence).join(" ")}&op=translate`}
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
            <div className="h-full w-12"></div>
          )}
        </div>
      </div>
    </>
  );
}
