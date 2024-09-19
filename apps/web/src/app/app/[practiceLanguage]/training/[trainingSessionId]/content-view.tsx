"use client";

import { useCallback, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
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
import { useTrainingSession } from "~/providers/TrainingSessionProvider";
import { useUserSettings } from "~/providers/UserSettingsProvider";
import { promptAtom } from "~/store";
import { api } from "~/trpc/react";
import { TTS_SPEED_OPTIONS } from "~/utils/constants";

export default function ContentView() {
  const { trainingSession, changeSentenceIndex } = useTrainingSession();
  const { userSettings } = useUserSettings();
  const [speed, setSpeed] = useState(userSettings.ttsSpeed);
  const promptTemplate = useAtomValue(promptAtom);

  const utils = api.useUtils();

  const sentencesQuery = api.sentences.getSentences.useQuery({
    trainingSessionId: trainingSession.id,
  });

  const updateUserSettingsMut =
    api.userSettings.updateUserSettings.useMutation();

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

  const currentSentence = useMemo(
    () => sentencesQuery.data?.[trainingSession.sentenceIndex],
    [sentencesQuery.data, trainingSession.sentenceIndex],
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
                sentencesQuery.isSuccess && trainingSession.sentenceIndex <= 0
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
                trainingSession.sentenceIndex >= sentencesQuery.data.length
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
