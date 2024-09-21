import { useCallback, useRef } from "react";

import type { RouterInputs } from "@acme/api";

import { api } from "~/trpc/react";
import { voices } from "./SettingsForm";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";

export const AudioSettings = () => {
  const utils = api.useUtils();
  const userSettignsQuery = api.userSettings.getUserSettings.useQuery();
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
      if (!userSettignsQuery.isSuccess) {
        return;
      }
      updateUserSettingsMut.mutate({ autoPlayAudio });
      utils.userSettings.getUserSettings.setData(undefined, {
        ...userSettignsQuery.data,
        autoPlayAudio,
      });
    },
    [
      updateUserSettingsMut,
      userSettignsQuery.data,
      userSettignsQuery.isSuccess,
      utils.userSettings.getUserSettings,
    ],
  );

  const handleChangeTtsVoice = useCallback(
    (ttsVoice: string) => {
      if (!userSettignsQuery.isSuccess) {
        return;
      }
      updateUserSettingsMut.mutate({ ttsVoice });
      utils.userSettings.getUserSettings.setData(undefined, {
        ...userSettignsQuery.data,
        ttsVoice,
      });
    },
    [
      updateUserSettingsMut,
      userSettignsQuery.data,
      userSettignsQuery.isSuccess,
      utils.userSettings.getUserSettings,
    ],
  );

  const handleChangeTtsSpeed = useCallback(
    (ttsSpeed: number) => {
      if (!userSettignsQuery.isSuccess) {
        return;
      }
      debouncedUpdateUserSettings({ ttsSpeed });
      utils.userSettings.getUserSettings.setData(undefined, {
        ...userSettignsQuery.data,
        ttsSpeed,
      });
    },
    [
      debouncedUpdateUserSettings,
      userSettignsQuery.data,
      userSettignsQuery.isSuccess,
      utils.userSettings.getUserSettings,
    ],
  );

  if (userSettignsQuery.isPending) {
    return <p>Loading...</p>;
  }

  if (userSettignsQuery.isError) {
    return <p>{userSettignsQuery.error.message}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <fieldset className="col-span-full flex items-center justify-between">
        <Label htmlFor="auto-play">Auto Play</Label>
        <Switch
          checked={userSettignsQuery.data.autoPlayAudio}
          id="auto-play"
          onCheckedChange={handleChangeAutoPlay}
        />
      </fieldset>

      <fieldset className="col-span-full space-y-1">
        <Label htmlFor="voice">Voice</Label>
        <Select
          value={userSettignsQuery.data.ttsVoice}
          onValueChange={handleChangeTtsVoice}
        >
          <SelectTrigger id="voice">
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
      </fieldset>

      <fieldset className="col-span-full space-y-1">
        <Label htmlFor="speed">
          Speed ({userSettignsQuery.data.ttsSpeed}x)
        </Label>
        <Slider
          max={4}
          min={0.25}
          onValueChange={(values) => handleChangeTtsSpeed(values[0] ?? 1)}
          step={0.1}
          value={[userSettignsQuery.data.ttsSpeed]}
        />
      </fieldset>
    </div>
  );
};
