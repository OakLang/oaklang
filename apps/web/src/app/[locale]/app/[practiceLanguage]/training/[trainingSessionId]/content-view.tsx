"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import AudioPlayButton from "~/components/AudioPlayButton";
import InterlinearView from "~/components/InterlinearView";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useTrainingSessionId } from "~/hooks/useTrainingSessionId";
import { useUpdateTrainingSessionMutation } from "~/hooks/useUpdateTrainingSessionMutation";
import { useUpdateUserSettingsMutation } from "~/hooks/useUpdateUserSettings";
import { useAppStore } from "~/providers/app-store-provider";
import { api } from "~/trpc/react";
import { TTS_SPEED_OPTIONS } from "~/utils/constants";

export default function ContentView() {
  const [initialGenerateSentencesCalled, setInitialGenerateSentencesCalled] =
    useState(false);
  const trainingSessionId = useTrainingSessionId();

  const generateSentencesPromptTemplate = useAppStore(
    (state) => state.generateSentencesPromptTemplate,
  );
  const generateSentenceWordsPromptTemplate = useAppStore(
    (state) => state.generateSentenceWordsPromptTemplate,
  );

  const utils = api.useUtils();
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();
  const updateUserSettingsMutation = useUpdateUserSettingsMutation();
  const trainingSessionQuery =
    api.trainingSessions.getTrainingSession.useQuery(trainingSessionId);
  const sentencesQuery = api.sentences.getSentences.useQuery(
    { trainingSessionId },
    { enabled: trainingSessionQuery.isSuccess },
  );
  const updateTrainingSessionMutation = useUpdateTrainingSessionMutation();

  const generateSentencesMut = api.sentences.generateSentences.useMutation({
    onSuccess: (data, { trainingSessionId }) => {
      utils.sentences.getSentences.setData(
        { trainingSessionId },
        (sentences) => [...(sentences ?? []), ...data],
      );
    },
    onError: (error) => {
      toast("Failed to generate sentences", { description: error.message });
    },
  });

  const currentSentence = useMemo(() => {
    if (trainingSessionQuery.isSuccess && sentencesQuery.isSuccess) {
      return sentencesQuery.data[trainingSessionQuery.data.sentenceIndex];
    }
  }, [
    sentencesQuery.data,
    sentencesQuery.isSuccess,
    trainingSessionQuery.data?.sentenceIndex,
    trainingSessionQuery.isSuccess,
  ]);
  const isFetchingCurrentSentenceWords = useIsFetching({
    queryKey: getQueryKey(
      api.sentences.getSentenceWords,
      { sentenceId: currentSentence?.id },
      "query",
    ),
  });

  const handleNext = useCallback(() => {
    if (!sentencesQuery.isSuccess || !trainingSessionQuery.isSuccess) {
      return;
    }
    if (
      !generateSentencesMut.isPending &&
      trainingSessionQuery.data.sentenceIndex >= sentencesQuery.data.length - 3
    ) {
      generateSentencesMut.mutate({
        trainingSessionId,
        promptTemplate: generateSentencesPromptTemplate,
      });
    }
    if (trainingSessionQuery.data.sentenceIndex >= sentencesQuery.data.length) {
      console.log("Can not go next");
      return;
    }
    const newSentenceIndex = trainingSessionQuery.data.sentenceIndex + 1;
    updateTrainingSessionMutation.mutate({
      trainingSessionId,
      data: { sentenceIndex: newSentenceIndex },
    });
  }, [
    generateSentencesMut,
    sentencesQuery.data?.length,
    sentencesQuery.isSuccess,
    trainingSessionId,
    trainingSessionQuery.data?.sentenceIndex,
    trainingSessionQuery.isSuccess,
    updateTrainingSessionMutation,
    generateSentencesPromptTemplate,
  ]);

  const handlePrevious = useCallback(() => {
    if (!sentencesQuery.isSuccess || !trainingSessionQuery.isSuccess) return;
    if (trainingSessionQuery.data.sentenceIndex <= 0) {
      return;
    }
    const newSentenceIndex = trainingSessionQuery.data.sentenceIndex - 1;
    updateTrainingSessionMutation.mutate({
      trainingSessionId,
      data: { sentenceIndex: newSentenceIndex },
    });
  }, [
    sentencesQuery.isSuccess,
    trainingSessionId,
    trainingSessionQuery.data?.sentenceIndex,
    trainingSessionQuery.isSuccess,
    updateTrainingSessionMutation,
  ]);

  useEffect(() => {
    if (
      !initialGenerateSentencesCalled &&
      sentencesQuery.isSuccess &&
      sentencesQuery.data.length === 0 &&
      !generateSentencesMut.isPending
    ) {
      setInitialGenerateSentencesCalled(true);
      generateSentencesMut.mutate({
        trainingSessionId,
        promptTemplate: generateSentencesPromptTemplate,
      });
    }
  }, [
    generateSentencesMut,
    initialGenerateSentencesCalled,
    sentencesQuery.data?.length,
    sentencesQuery.isSuccess,
    trainingSessionId,
    generateSentencesPromptTemplate,
  ]);

  useEffect(() => {
    const index = trainingSessionQuery.data?.sentenceIndex;
    if (!index) {
      return;
    }

    const nextSentence = sentencesQuery.data?.find(
      (sent) => sent.index === index + 2,
    );
    if (nextSentence) {
      void utils.sentences.getSentenceWords.ensureData({
        sentenceId: nextSentence.id,
        promptTemplate: generateSentenceWordsPromptTemplate,
      });
    }
  }, [
    trainingSessionId,
    trainingSessionQuery.data?.sentenceIndex,
    utils.sentences.getSentenceWords,
    utils.sentences.getSentences,
    sentencesQuery.data,
    generateSentenceWordsPromptTemplate,
  ]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-1 gap-4 py-8 md:py-16">
        <div className="md:pl-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="text-muted-foreground h-full w-12"
                size="icon"
                disabled={
                  sentencesQuery.isSuccess &&
                  trainingSessionQuery.isSuccess &&
                  trainingSessionQuery.data.sentenceIndex <= 0
                }
                onClick={handlePrevious}
              >
                <ChevronLeftIcon className="h-8 w-8" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Previous Sentence</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-screen-md flex-1 flex-col">
            {currentSentence ? (
              <>
                {isFetchingCurrentSentenceWords === 0 ? (
                  <div className="mb-4 flex items-center justify-center gap-2 md:mb-8">
                    <AudioPlayButton
                      text={currentSentence.sentence}
                      speed={userSettingsQuery.data?.ttsSpeed ?? 1}
                      autoPlay={userSettingsQuery.data?.autoPlayAudio === true}
                    />
                    <Tooltip>
                      <Select
                        value={String(userSettingsQuery.data?.ttsSpeed ?? "1")}
                        onValueChange={(value) =>
                          updateUserSettingsMutation.mutate({
                            ttsSpeed: Number(value),
                          })
                        }
                      >
                        <TooltipTrigger asChild>
                          <SelectTrigger
                            id="voice"
                            className="h-8 w-fit rounded-full pl-2.5 pr-2"
                          >
                            <SelectValue />
                          </SelectTrigger>
                        </TooltipTrigger>
                        <SelectContent>
                          {TTS_SPEED_OPTIONS.map((value) => (
                            <SelectItem key={value} value={String(value)}>
                              {value}x
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <TooltipContent>Playback speed</TooltipContent>
                    </Tooltip>
                  </div>
                ) : (
                  <div className="mb-4 flex items-center justify-center gap-2 md:mb-8">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <Skeleton className="h-8 w-14 rounded-full" />
                  </div>
                )}

                <InterlinearView
                  sentences={[currentSentence]}
                  onNextSentence={handleNext}
                  onPreviousSentence={handlePrevious}
                />
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-4">
                  <Loader2Icon className="h-6 w-6 animate-spin" />
                  <p className="text-muted-foreground text-center">
                    {generateSentencesMut.isPending
                      ? "Generating Sentences..."
                      : "Loading..."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="md:pr-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="text-muted-foreground h-full w-12"
                size="icon"
                disabled={
                  sentencesQuery.isSuccess &&
                  trainingSessionQuery.isSuccess &&
                  trainingSessionQuery.data.sentenceIndex >=
                    sentencesQuery.data.length
                }
                onClick={handleNext}
              >
                <ChevronRightIcon className="h-8 w-8" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Next Sentence</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
