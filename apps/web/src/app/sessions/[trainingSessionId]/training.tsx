/* eslint-disable @typescript-eslint/no-non-null-assertion */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";

import InterlinearList from "~/components/InterlinearList";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useHotkeysTooltipProps } from "~/hooks/useHotkeysTooltipProps";
import { useTrainingSession } from "~/providers/TrainingSessionProvider";
import { knownIPAsAtom, knownTranslationsAtom, promptAtom } from "~/store";
import { api } from "~/trpc/react";
import { cn } from "~/utils";

export default function Training() {
  const nextBtnTooltipProps = useHotkeysTooltipProps();
  const previousBtnTooltipProps = useHotkeysTooltipProps();
  const helpBtnTooltipProps = useHotkeysTooltipProps();
  const toggleShowTranslationBtnTooltipProps = useHotkeysTooltipProps();
  const allWordsKnownBtnTooltipProps = useHotkeysTooltipProps();
  const [showTranslation, setShowTranslation] = useState(false);

  const setKnownIPAs = useSetAtom(knownIPAsAtom);
  const setKnownTranslations = useSetAtom(knownTranslationsAtom);
  const promptTemplate = useAtomValue(promptAtom);

  const [initialGenerateSentencesCalled, setInitialGenerateSentencesCalled] =
    useState(false);

  const { trainingSession, changeSentenceIndex, setKnownWords, knownWords } =
    useTrainingSession();

  const utils = api.useUtils();
  const sentencesQuery = api.sentences.getSentences.useQuery({
    trainingSessionId: trainingSession.id,
  });

  const generateMoreSentencesMut =
    api.sentences.generateMoreSentences.useMutation({
      onSuccess: (data, { trainingSessionId }) => {
        utils.sentences.getSentences.setData(
          { trainingSessionId },
          (sentences) => [...(sentences ?? []), ...data],
        );
        void utils.sentences.getSentences.invalidate();
      },
      onError: (error) => {
        toast("Failed to generate sentences", { description: error.message });
      },
    });

  const handleNext = useCallback(() => {
    if (!sentencesQuery.isSuccess) return;
    if (
      !generateMoreSentencesMut.isPending &&
      trainingSession.sentenceIndex >= sentencesQuery.data.length - 3
    ) {
      generateMoreSentencesMut.mutate({
        trainingSessionId: trainingSession.id,
        promptTemplate,
      });
    }
    if (trainingSession.sentenceIndex >= sentencesQuery.data.length) {
      console.log("Can not go next");
      return;
    }
    changeSentenceIndex(trainingSession.sentenceIndex + 1);
  }, [
    changeSentenceIndex,
    generateMoreSentencesMut,
    sentencesQuery.data?.length,
    sentencesQuery.isSuccess,
    trainingSession.id,
    trainingSession.sentenceIndex,
    promptTemplate,
  ]);

  const handlePrevious = useCallback(() => {
    if (!sentencesQuery.isSuccess) return;
    if (trainingSession.sentenceIndex <= 0) {
      return;
    }
    changeSentenceIndex(trainingSession.sentenceIndex - 1);
  }, [
    changeSentenceIndex,
    sentencesQuery.isSuccess,
    trainingSession.sentenceIndex,
  ]);

  const handleHelp = useCallback(() => {
    setKnownIPAs([]);
    setKnownTranslations([]);
  }, [setKnownIPAs, setKnownTranslations]);

  const toggleShowTranslation = useCallback(() => {
    setShowTranslation(!showTranslation);
  }, [showTranslation]);

  const handleAllWordsKnown = useCallback(() => {
    if (!sentencesQuery.isSuccess) return;
    const sentence = sentencesQuery.data[trainingSession.sentenceIndex];
    if (!sentence) {
      return;
    }
    const words = sentence.words.map((word) => word.lemma);
    const uniqueWords = words.filter((word) => !knownWords.includes(word));
    setKnownWords([...knownWords, ...uniqueWords]);
  }, [
    knownWords,
    sentencesQuery.data,
    sentencesQuery.isSuccess,
    setKnownWords,
    trainingSession.sentenceIndex,
  ]);

  useHotkeys("n", () => {
    handleNext();
  });

  useHotkeys("p", () => {
    handlePrevious();
  });

  useHotkeys("h", () => {
    handleHelp();
  });

  useHotkeys("t", () => {
    toggleShowTranslation();
  });

  useHotkeys("k", () => {
    handleAllWordsKnown();
  });

  useEffect(() => {
    if (
      !initialGenerateSentencesCalled &&
      sentencesQuery.isSuccess &&
      sentencesQuery.data.length === 0 &&
      !generateMoreSentencesMut.isPending
    ) {
      setInitialGenerateSentencesCalled(true);
      generateMoreSentencesMut.mutate({
        trainingSessionId: trainingSession.id,
        promptTemplate,
      });
    }
  }, [
    generateMoreSentencesMut,
    initialGenerateSentencesCalled,
    sentencesQuery.data?.length,
    sentencesQuery.isSuccess,
    trainingSession.id,
    promptTemplate,
  ]);

  return (
    <>
      <div className="container max-w-screen-xl flex-1 px-4">
        {sentencesQuery.isPending ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : sentencesQuery.isError ? (
          <div className="py-4">
            <p>{sentencesQuery.error.message}</p>
          </div>
        ) : (
          <>
            {sentencesQuery.data[trainingSession.sentenceIndex] ? (
              <>
                <div className="my-16">
                  <p
                    className={cn(
                      "pointer-events-none text-center font-serif text-3xl font-medium opacity-0 transition-opacity duration-300",
                      {
                        "pointer-events-auto opacity-100": showTranslation,
                      },
                    )}
                  >
                    {
                      sentencesQuery.data[trainingSession.sentenceIndex]!
                        .sentence
                    }
                  </p>
                </div>
                <InterlinearList
                  sentence={sentencesQuery.data[trainingSession.sentenceIndex]!}
                />
                <div className="my-16">
                  <p
                    className={cn(
                      "pointer-events-none text-center font-serif text-3xl font-medium opacity-0 transition-opacity duration-300",
                      {
                        "pointer-events-auto opacity-100": showTranslation,
                      },
                    )}
                  >
                    {
                      sentencesQuery.data[trainingSession.sentenceIndex]!
                        .translation
                    }
                  </p>
                </div>
              </>
            ) : (
              <p>Generating sentences...</p>
            )}

            <div className="my-4 flex items-center justify-center gap-4">
              <Tooltip {...previousBtnTooltipProps}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handlePrevious}
                    disabled={trainingSession.sentenceIndex <= 0}
                  >
                    <ArrowLeft className="-ml-1 mr-2 h-5 w-5" />
                    Previous
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hotkey: P(revious)</TooltipContent>
              </Tooltip>
              <Tooltip {...nextBtnTooltipProps}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleNext}
                    disabled={
                      trainingSession.sentenceIndex >=
                      sentencesQuery.data.length
                    }
                  >
                    Next
                    <ArrowRight className="-mr-1 ml-2 h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hotkey: N(ext)</TooltipContent>
              </Tooltip>
            </div>

            <div className="my-4 flex items-center justify-center gap-4">
              <Tooltip {...helpBtnTooltipProps}>
                <TooltipTrigger asChild>
                  <Button onClick={handleHelp} variant="outline">
                    Help 100%
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hotkey: H(elp)</TooltipContent>
              </Tooltip>
              <Tooltip {...toggleShowTranslationBtnTooltipProps}>
                <TooltipTrigger asChild>
                  <Button onClick={toggleShowTranslation} variant="outline">
                    {showTranslation ? "Hide Translation" : "Show Translation"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hotkey: (T)ranslation</TooltipContent>
              </Tooltip>{" "}
              <Tooltip {...allWordsKnownBtnTooltipProps}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleAllWordsKnown}
                    disabled={!sentencesQuery.isSuccess}
                    variant="outline"
                  >
                    All words known
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hotkey: K(nown)</TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </div>
    </>
  );
}
