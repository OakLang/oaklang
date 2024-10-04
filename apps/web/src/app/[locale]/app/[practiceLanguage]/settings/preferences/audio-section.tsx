"use client";

import { TTS_SPEED_OPTIONS } from "@acme/core/constants";

import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { useUpdateUserSettingsMutation } from "~/hooks/useUpdateUserSettings";
import { api } from "~/trpc/react";

const voices: { voice: string; name: string }[] = [
  { voice: "alloy", name: "Alloy" },
  { voice: "echo", name: "Echo" },
  { voice: "fable", name: "Fable" },
  { voice: "onyx", name: "Onyx" },
  { voice: "nova", name: "Nova" },
  { voice: "shimmer", name: "Shimmer" },
];

export default function AudioSection() {
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();
  const updateUserSettingsMutation = useUpdateUserSettingsMutation();

  return (
    <div className="grid gap-6">
      <h2 className="text-xl font-medium">Audio</h2>
      <div className="grid gap-4">
        <div className="flex items-center">
          <Label htmlFor="auto-play" className="flex-1 truncate">
            Auto Play
          </Label>
          <Switch
            checked={userSettingsQuery.data?.autoPlayAudio}
            id="auto-play"
            onCheckedChange={(autoPlayAudio) =>
              updateUserSettingsMutation.mutate({ autoPlayAudio })
            }
          />
        </div>

        <div className="flex items-center">
          <Label htmlFor="voice" className="flex-1 truncate">
            Voice
          </Label>
          <Select
            value={userSettingsQuery.data?.ttsVoice}
            onValueChange={(ttsVoice) =>
              updateUserSettingsMutation.mutate({ ttsVoice })
            }
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

        <div className="flex items-center">
          <Label htmlFor="speed" className="flex-1 truncate">
            Speed ({userSettingsQuery.data?.ttsSpeed}x)
          </Label>

          <Select
            value={String(userSettingsQuery.data?.ttsSpeed)}
            onValueChange={(value) =>
              updateUserSettingsMutation.mutate({ ttsSpeed: Number(value) })
            }
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
    </div>
  );
}
