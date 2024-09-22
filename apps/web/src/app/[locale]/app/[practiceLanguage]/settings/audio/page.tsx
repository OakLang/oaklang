"use client";

import { useCallback, useRef } from "react";

import type { RouterInputs } from "~/trpc/react";
import PageTitle from "~/components/PageTitle";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { api } from "~/trpc/react";
import { TTS_SPEED_OPTIONS } from "~/utils/constants";

const voices: { voice: string; name: string }[] = [
  { voice: "alloy", name: "Alloy" },
  { voice: "echo", name: "Echo" },
  { voice: "fable", name: "Fable" },
  { voice: "onyx", name: "Onyx" },
  { voice: "nova", name: "Nova" },
  { voice: "shimmer", name: "Shimmer" },
];

export default function AudioSettings() {
  const utils = api.useUtils();
  const userSettings = api.userSettings.getUserSettings.useQuery();
  const updateUserSettingsMut =
    api.userSettings.updateUserSettings.useMutation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedUpdateUserSettings = useCallback(
    (settings: RouterInputs["userSettings"]["updateUserSettings"]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        updateUserSettingsMut.mutate(settings);
      }, 300);
    },
    [updateUserSettingsMut],
  );

  const handleChangeAutoPlay = useCallback(
    (autoPlayAudio: boolean) => {
      if (!userSettings.isSuccess) {
        return;
      }
      updateUserSettingsMut.mutate({ autoPlayAudio });
      utils.userSettings.getUserSettings.setData(undefined, {
        ...userSettings.data,
        autoPlayAudio,
      });
    },
    [
      updateUserSettingsMut,
      userSettings.data,
      userSettings.isSuccess,
      utils.userSettings.getUserSettings,
    ],
  );

  const handleChangeTtsVoice = useCallback(
    (ttsVoice: string) => {
      if (!userSettings.isSuccess) {
        return;
      }
      updateUserSettingsMut.mutate({ ttsVoice });
      utils.userSettings.getUserSettings.setData(undefined, {
        ...userSettings.data,
        ttsVoice,
      });
    },
    [
      updateUserSettingsMut,
      userSettings.data,
      userSettings.isSuccess,
      utils.userSettings.getUserSettings,
    ],
  );

  const handleChangeTtsSpeed = useCallback(
    (ttsSpeed: number) => {
      if (!userSettings.isSuccess) {
        return;
      }
      debouncedUpdateUserSettings({ ttsSpeed });
      utils.userSettings.getUserSettings.setData(undefined, {
        ...userSettings.data,
        ttsSpeed,
      });
    },
    [
      debouncedUpdateUserSettings,
      userSettings.data,
      userSettings.isSuccess,
      utils.userSettings.getUserSettings,
    ],
  );

  return (
    <div className="container mx-auto max-w-screen-md px-4 py-16">
      <PageTitle title="Audio" description="Manage your audio settings" />

      <Separator className="my-8" />

      <div className="flex items-center">
        <Label htmlFor="auto-play" className="flex-1 truncate">
          Auto Play
        </Label>
        <Switch
          checked={userSettings.data?.autoPlayAudio}
          id="auto-play"
          onCheckedChange={handleChangeAutoPlay}
        />
      </div>

      <Separator className="my-4" />

      <div className="flex items-center">
        <Label htmlFor="voice" className="flex-1 truncate">
          Voice
        </Label>
        <Select
          value={userSettings.data?.ttsVoice}
          onValueChange={handleChangeTtsVoice}
        >
          <SelectTrigger id="voice" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {voices.map((voice) => (
              <SelectItem key={voice.voice} value={voice.voice}>
                {voice.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="my-4" />

      <div className="flex items-center">
        <Label htmlFor="speed" className="flex-1 truncate">
          Speed ({userSettings.data?.ttsSpeed}x)
        </Label>

        <Select
          value={String(userSettings.data?.ttsSpeed)}
          onValueChange={(value) => handleChangeTtsSpeed(Number(value))}
        >
          <SelectTrigger id="voice" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TTS_SPEED_OPTIONS.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value}x
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
