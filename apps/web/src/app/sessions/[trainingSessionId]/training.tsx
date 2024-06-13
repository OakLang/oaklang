"use client";

import { useCallback, useEffect, useState } from "react";
import { useSetAtom } from "jotai";
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
import { knownIPAsAtom, knownTranslationsAtom } from "~/store";
import { api } from "~/trpc/react";

export default function Training() {
  const nextBtnTooltipProps = useHotkeysTooltipProps();
  const previousBtnTooltipProps = useHotkeysTooltipProps();
  const helpBtnTooltipProps = useHotkeysTooltipProps();

  const setKnownIPAs = useSetAtom(knownIPAsAtom);
  const setKnownTranslations = useSetAtom(knownTranslationsAtom);

  const [initialGenerateSentencesCalled, setInitialGenerateSentencesCalled] =
    useState(false);
  const { trainingSession, changeSentenceIndex } = useTrainingSession();
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

  useHotkeys("n", () => {
    handleNext();
  });

  useHotkeys("p", () => {
    handlePrevious();
  });

  useHotkeys("h", () => {
    handleHelp();
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
      });
    }
  }, [
    generateMoreSentencesMut,
    initialGenerateSentencesCalled,
    sentencesQuery.data?.length,
    sentencesQuery.isSuccess,
    trainingSession.id,
  ]);

  return (
    <div className="container my-8 px-4">
      {sentencesQuery.isPending ? (
        <p>Loading...</p>
      ) : sentencesQuery.isError ? (
        <p>{sentencesQuery.error.message}</p>
      ) : (
        <>
          {sentencesQuery.data[trainingSession.sentenceIndex] ? (
            <InterlinearList
              sentence={sentencesQuery.data[trainingSession.sentenceIndex]}
            />
          ) : (
            <p>Generating sentences...</p>
          )}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-10">
            <Tooltip {...helpBtnTooltipProps}>
              <TooltipTrigger asChild>
                <Button onClick={handleHelp} variant="outline">
                  Help 100%
                </Button>
              </TooltipTrigger>
              <TooltipContent>Hotkey: H(elp)</TooltipContent>
            </Tooltip>
            <Tooltip {...previousBtnTooltipProps}>
              <TooltipTrigger asChild>
                <Button
                  onClick={handlePrevious}
                  disabled={trainingSession.sentenceIndex <= 0}
                >
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
                    trainingSession.sentenceIndex >= sentencesQuery.data.length
                  }
                >
                  Next
                </Button>
              </TooltipTrigger>
              <TooltipContent>Hotkey: N(ext)</TooltipContent>
            </Tooltip>
          </div>
        </>
      )}
    </div>
  );
}
