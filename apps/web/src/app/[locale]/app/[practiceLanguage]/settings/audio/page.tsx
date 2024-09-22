"use client";

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
import { useUserSettingsStore } from "~/providers/user-settings-store-provider";
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
  const ttsSpeed = useUserSettingsStore((state) => state.userSettings.ttsSpeed);
  const ttsVoice = useUserSettingsStore((state) => state.userSettings.ttsVoice);
  const autoPlayAudio = useUserSettingsStore(
    (state) => state.userSettings.autoPlayAudio,
  );
  const setTtsSpeed = useUserSettingsStore((state) => state.setTtsSpeed);
  const setTtsVoice = useUserSettingsStore((state) => state.setTtsVoice);
  const setAutoPlayAudio = useUserSettingsStore(
    (state) => state.setAutoPlayAudio,
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
          checked={autoPlayAudio}
          id="auto-play"
          onCheckedChange={setAutoPlayAudio}
        />
      </div>

      <Separator className="my-4" />

      <div className="flex items-center">
        <Label htmlFor="voice" className="flex-1 truncate">
          Voice
        </Label>
        <Select value={ttsVoice} onValueChange={setTtsVoice}>
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
          Speed ({ttsSpeed}x)
        </Label>

        <Select
          value={String(ttsSpeed)}
          onValueChange={(value) => setTtsSpeed(Number(value))}
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
