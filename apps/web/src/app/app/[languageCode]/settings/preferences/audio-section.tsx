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
import { useUserSettings } from "~/providers/user-settings-provider";

const voices: { voice: string; name: string }[] = [
  { voice: "alloy", name: "Alloy" },
  { voice: "echo", name: "Echo" },
  { voice: "fable", name: "Fable" },
  { voice: "onyx", name: "Onyx" },
  { voice: "nova", name: "Nova" },
  { voice: "shimmer", name: "Shimmer" },
];

export default function AudioSection() {
  const { userSettings, updateUserSettings } = useUserSettings();

  return (
    <div className="grid gap-6">
      <h2 className="text-xl font-medium">Audio</h2>
      <div className="grid gap-4">
        <div className="flex items-center">
          <Label htmlFor="auto-play" className="flex-1 truncate">
            Auto Play
          </Label>
          <Switch
            checked={userSettings.autoPlayAudio}
            id="auto-play"
            onCheckedChange={(autoPlayAudio) =>
              updateUserSettings.mutate({ autoPlayAudio })
            }
          />
        </div>

        <div className="flex items-center">
          <Label htmlFor="voice" className="flex-1 truncate">
            Voice
          </Label>
          <Select
            value={userSettings.ttsVoice}
            onValueChange={(ttsVoice) =>
              updateUserSettings.mutate({ ttsVoice })
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
            Speed ({userSettings.ttsSpeed}x)
          </Label>

          <Select
            value={String(userSettings.ttsSpeed)}
            onValueChange={(value) =>
              updateUserSettings.mutate({ ttsSpeed: Number(value) })
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
