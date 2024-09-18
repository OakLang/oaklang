"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  SidebarCloseIcon,
  SidebarOpenIcon,
} from "lucide-react";

import AudioPlayButton from "~/components/AudioPlayButton";
import Interlinear from "~/components/InterlinearLine";
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
import WordInspectionPanel from "~/components/WordInspectionPanel";
import { usePracticeLanguage } from "~/providers/PracticeLanguageProvider";
import { useTrainingSession } from "~/providers/TrainingSessionProvider";
import { useUserSettings } from "~/providers/UserSettingsProvider";
import { api } from "~/trpc/react";
import { TTS_SPEED_OPTIONS } from "~/utils/constants";

export default function TrainingPage() {
  const { sidebarOpen, inspectedWord } = useTrainingSession();

  return (
    <div className="relative flex flex-1">
      <div className="relative flex flex-1 flex-col">
        <AppBar />

        <InterlinearView />

        <div className="h-20 flex-shrink-0 border-t"></div>
      </div>
      {sidebarOpen && (
        <aside className="w-96 flex-shrink-0 border-l">
          {inspectedWord ? (
            <WordInspectionPanel word={inspectedWord} />
          ) : (
            <p className="text-muted-foreground p-4">Select a word</p>
          )}
        </aside>
      )}
    </div>
  );
}

const AppBar = () => {
  const { trainingSession, sidebarOpen, setSidebarOpen } = useTrainingSession();
  const { practiceLanguage } = usePracticeLanguage();

  return (
    <header className="flex flex-shrink-0 items-center p-2">
      <div className="flex flex-1 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2" asChild>
              <Link href={`/app/${practiceLanguage.code}`}>
                <ArrowLeftIcon className="h-5 w-5" />
                <div className="sr-only">Back</div>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back</TooltipContent>
        </Tooltip>

        <h1 className="text-lg font-medium">{trainingSession.title}</h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost">
              <MoreHorizontalIcon className="h-5 w-5 rotate-180" />
              <div className="sr-only">Options</div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Options</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <SidebarCloseIcon className="h-5 w-5 rotate-180" />
              ) : (
                <SidebarOpenIcon className="h-5 w-5 rotate-180" />
              )}
              <div className="sr-only">
                {sidebarOpen ? "Colapse Sidebar" : "Expand sidebar"}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {sidebarOpen ? "Colapse Sidebar" : "Expand sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
};

const InterlinearView = () => {
  const { trainingSession } = useTrainingSession();
  const { userSettings } = useUserSettings();
  const [speed, setSpeed] = useState(userSettings.ttsSpeed);

  const sentencesQuery = api.sentences.getSentences.useQuery({
    trainingSessionId: trainingSession.id,
  });
  const updateUserSettingsMut =
    api.userSettings.updateUserSettings.useMutation();

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

  return (
    <div className="flex flex-1 gap-4 py-8 md:py-16">
      <div className="md:pl-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="text-muted-foreground h-full w-12"
              size="icon"
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
              <Interlinear sentences={[currentSentence]} />
            </>
          ) : (
            <div className="space-y-4">
              <Skeleton className="h-8 w-4/5" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-8 w-8/12" />
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
            >
              <ChevronRightIcon className="h-8 w-8" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Next Sentence</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
