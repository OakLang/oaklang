"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useTrainingSessionStore } from "~/providers/training-session-store-provider";
import { api } from "~/trpc/react";
import { TTS_SPEED_OPTIONS } from "~/utils/constants";

export default function ContentView() {
  const [initialGenerateSentencesCalled, setInitialGenerateSentencesCalled] =
    useState(false);
  const changeSentenceIndex = useTrainingSessionStore(
    (state) => state.changeSentenceIndex,
  );
  const promptTemplate = useTrainingSessionStore(
    (state) => state.promptTemplate,
  );
  const trainingSessionId = useTrainingSessionStore(
    (state) => state.trainingSession.id,
  );
  const sentenceIndex = useTrainingSessionStore((state) => state.sentenceIndex);

  const userSettings = api.userSettings.getUserSettings.useQuery();
  const [speed, setSpeed] = useState(userSettings.data?.ttsSpeed);

  const utils = api.useUtils();

  const sentencesQuery = api.sentences.getSentences.useQuery({
    trainingSessionId,
  });

  const updateUserSettingsMut =
    api.userSettings.updateUserSettings.useMutation();

  const updateTrainingSessionMut =
    api.trainingSessions.updateTrainingSession.useMutation({
      onMutate: () => {
        return { sentenceIndex };
      },
      onError: (error, _, ctx) => {
        toast("Faield to change sentence Index", {
          description: error.message,
        });
        if (ctx) {
          changeSentenceIndex(ctx.sentenceIndex);
        }
      },
    });

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

  const currentSentence = useMemo(
    () => sentencesQuery.data?.[sentenceIndex],
    [sentencesQuery.data, sentenceIndex],
  );

  const handleTTSSpeedChange = useCallback(
    (newSpeed: number) => {
      updateUserSettingsMut.mutate({ ttsSpeed: newSpeed });
      setSpeed(newSpeed);
    },
    [updateUserSettingsMut],
  );

  const handleNext = useCallback(() => {
    if (!sentencesQuery.isSuccess) return;
    if (
      !generateMoreSentencesMut.isPending &&
      sentenceIndex >= sentencesQuery.data.length - 3
    ) {
      generateMoreSentencesMut.mutate({
        trainingSessionId,
        promptTemplate,
      });
    }
    if (sentenceIndex >= sentencesQuery.data.length) {
      console.log("Can not go next");
      return;
    }
    const newSentenceIndex = sentenceIndex + 1;
    changeSentenceIndex(newSentenceIndex);
    updateTrainingSessionMut.mutate({
      trainingSessionId,
      data: { sentenceIndex: newSentenceIndex },
    });
  }, [
    sentencesQuery.isSuccess,
    sentencesQuery.data?.length,
    generateMoreSentencesMut,
    sentenceIndex,
    changeSentenceIndex,
    updateTrainingSessionMut,
    trainingSessionId,
    promptTemplate,
  ]);

  const handlePrevious = useCallback(() => {
    if (!sentencesQuery.isSuccess) return;
    if (sentenceIndex <= 0) {
      return;
    }
    const newSentenceIndex = sentenceIndex - 1;
    changeSentenceIndex(newSentenceIndex);
    updateTrainingSessionMut.mutate({
      trainingSessionId,
      data: { sentenceIndex: newSentenceIndex },
    });
  }, [
    sentencesQuery.isSuccess,
    sentenceIndex,
    changeSentenceIndex,
    updateTrainingSessionMut,
    trainingSessionId,
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

  useEffect(() => {
    if (userSettings.isSuccess) {
      setSpeed(userSettings.data.ttsSpeed);
    }
  }, [userSettings.data?.ttsSpeed, userSettings.isSuccess]);

  return (
    <div className="flex flex-1 gap-4 py-8 md:py-16">
      <div className="md:pl-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="text-muted-foreground h-full w-12"
              size="icon"
              disabled={sentencesQuery.isSuccess && sentenceIndex <= 0}
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
                  speed={speed}
                />
                <Tooltip>
                  <Select
                    value={String(speed)}
                    onValueChange={(value) =>
                      handleTTSSpeedChange(Number(value))
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
                sentenceIndex >= sentencesQuery.data.length
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
