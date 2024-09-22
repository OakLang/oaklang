"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useUpdateTrainingSessionMutation } from "~/hooks/useUpdateTrainingSessionMutation";
import { useUpdateUserSettingsMutation } from "~/hooks/useUpdateUserSettings";
import { useAppStore } from "~/providers/app-store-provider";
import { api } from "~/trpc/react";
import { TTS_SPEED_OPTIONS } from "~/utils/constants";

export default function ContentView() {
  const [initialGenerateSentencesCalled, setInitialGenerateSentencesCalled] =
    useState(false);
  const { trainingSessionId } = useParams<{
    trainingSessionId: string;
  }>();

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

  const promptTemplate = useAppStore((state) => state.promptTemplate);

  const generateMoreSentencesMut =
    api.sentences.generateMoreSentences.useMutation({
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

  const handleNext = useCallback(() => {
    if (!sentencesQuery.isSuccess || !trainingSessionQuery.isSuccess) {
      return;
    }
    if (
      !generateMoreSentencesMut.isPending &&
      trainingSessionQuery.data.sentenceIndex >= sentencesQuery.data.length - 3
    ) {
      generateMoreSentencesMut.mutate({
        trainingSessionId,
        promptTemplate,
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
    generateMoreSentencesMut,
    sentencesQuery.data?.length,
    sentencesQuery.isSuccess,
    trainingSessionId,
    trainingSessionQuery.data?.sentenceIndex,
    trainingSessionQuery.isSuccess,
    updateTrainingSessionMutation,
    promptTemplate,
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
      !generateMoreSentencesMut.isPending
    ) {
      setInitialGenerateSentencesCalled(true);
      generateMoreSentencesMut.mutate({
        trainingSessionId,
        promptTemplate,
      });
    }
  }, [
    generateMoreSentencesMut,
    initialGenerateSentencesCalled,
    sentencesQuery.data?.length,
    sentencesQuery.isSuccess,
    trainingSessionId,
    promptTemplate,
  ]);

  return (
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
              <div className="mb-4 flex items-center justify-center gap-2 md:mb-8">
                <AudioPlayButton
                  text={currentSentence.sentence}
                  speed={userSettingsQuery.data?.ttsSpeed ?? 1}
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

              <InterlinearView sentences={[currentSentence]} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <Loader2Icon className="h-6 w-6 animate-spin" />
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
  );
}
