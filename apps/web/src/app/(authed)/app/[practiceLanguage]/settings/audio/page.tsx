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
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { useUserSettings } from "~/providers/UserSettingsProvider";
import { api } from "~/trpc/react";

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
  const { userSettings } = useUserSettings();
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
      updateUserSettingsMut.mutate({ autoPlayAudio });
      utils.userSettings.getUserSettings.setData(undefined, {
        ...userSettings,
        autoPlayAudio,
      });
    },
    [updateUserSettingsMut, userSettings, utils.userSettings.getUserSettings],
  );

  const handleChangeTtsVoice = useCallback(
    (ttsVoice: string) => {
      updateUserSettingsMut.mutate({ ttsVoice });
      utils.userSettings.getUserSettings.setData(undefined, {
        ...userSettings,
        ttsVoice,
      });
    },
    [updateUserSettingsMut, userSettings, utils.userSettings.getUserSettings],
  );

  const handleChangeTtsSpeed = useCallback(
    (ttsSpeed: number) => {
      debouncedUpdateUserSettings({ ttsSpeed });
      utils.userSettings.getUserSettings.setData(undefined, {
        ...userSettings,
        ttsSpeed,
      });
    },
    [
      debouncedUpdateUserSettings,
      userSettings,
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
          checked={userSettings.autoPlayAudio}
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
          value={userSettings.ttsVoice}
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
          Speed ({userSettings.ttsSpeed}x)
        </Label>
        <Slider
          max={4}
          min={0.25}
          onValueChange={(values) => handleChangeTtsSpeed(values[0] ?? 1)}
          step={0.1}
          value={[userSettings.ttsSpeed]}
          className="w-48"
        />
      </div>
    </div>
  );
}
