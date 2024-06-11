import { useAtom } from "jotai";

import type { Complexity, SentencesGeneratorSettings } from "@acme/validators";
import { complexityEnum, voiceEnum } from "@acme/validators";

import { audioSettingsAtom, sentencesGeneratorSettingsAtom } from "~/store";
import { appSettingsAtom } from "~/store/app-settings";
import { LANGUAGES } from "~/utils/constants/languages";
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
import { Textarea } from "./ui/textarea";

export interface Props {
  onChange: (settings: SentencesGeneratorSettings) => void;
  settings: SentencesGeneratorSettings;
}

const COMPLEXITIES: Complexity[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function SettingsForm() {
  const [sentencesGeneratorSettings, setSentencesGeneratorSettings] = useAtom(
    sentencesGeneratorSettingsAtom,
  );
  const [audioSettings, setAudioSettings] = useAtom(audioSettingsAtom);
  const [appSettings, setAppSettings] = useAtom(appSettingsAtom);

  return (
    <div className="space-y-4 py-4">
      <fieldset className="space-y-1">
        <Label htmlFor="auto-play">Auto Play</Label>
        <Switch
          checked={appSettings.autoPlay}
          id="auto-play"
          onCheckedChange={(autoPlay) =>
            setAppSettings({ ...appSettings, autoPlay })
          }
        />
      </fieldset>
      <fieldset className="space-y-1">
        <Label htmlFor="prompt-template">Propmt Template</Label>
        <Textarea
          id="prompt-template"
          onChange={(e) =>
            setSentencesGeneratorSettings({
              ...sentencesGeneratorSettings,
              prompt: e.target.value,
            })
          }
          rows={5}
          value={sentencesGeneratorSettings.prompt}
        />
      </fieldset>
      <fieldset className="space-y-1">
        <Label htmlFor="help-language">Help Language</Label>
        <Select
          onValueChange={(value) =>
            setSentencesGeneratorSettings({
              ...sentencesGeneratorSettings,
              helpLanguage: value,
            })
          }
          value={sentencesGeneratorSettings.helpLanguage}
        >
          <SelectTrigger id="help-language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((language) => (
              <SelectItem key={language} value={language}>
                {language}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </fieldset>
      <fieldset className="space-y-1">
        <Label htmlFor="practice-language">Practice Language</Label>
        <Select
          onValueChange={(value) =>
            setSentencesGeneratorSettings({
              ...sentencesGeneratorSettings,
              practiceLanguage: value,
            })
          }
          value={sentencesGeneratorSettings.practiceLanguage}
        >
          <SelectTrigger id="practice-language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((language) => (
              <SelectItem key={language} value={language}>
                {language}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </fieldset>
      <fieldset className="space-y-1">
        <Label htmlFor="practice-language">Num of Sentences</Label>
        <Select
          onValueChange={(value) =>
            setSentencesGeneratorSettings({
              ...sentencesGeneratorSettings,
              sentencesCount: Number(value),
            })
          }
          value={String(sentencesGeneratorSettings.sentencesCount)}
        >
          <SelectTrigger id="practice-language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((count) => (
              <SelectItem key={count} value={String(count)}>
                {count}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </fieldset>
      <fieldset className="space-y-1">
        <Label htmlFor="complexity">Complexity</Label>
        <Select
          onValueChange={(value) =>
            setSentencesGeneratorSettings({
              ...sentencesGeneratorSettings,
              complexity: complexityEnum.parse(value),
            })
          }
          value={sentencesGeneratorSettings.complexity}
        >
          <SelectTrigger id="complexity">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMPLEXITIES.map((complexity) => (
              <SelectItem key={complexity} value={String(complexity)}>
                {complexity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </fieldset>
      <p className="pt-4 font-semibold">Audio Settings</p>
      <fieldset className="space-y-1">
        <Label htmlFor="voice">Voice</Label>
        <Select
          onValueChange={(value) =>
            setAudioSettings({
              ...audioSettings,
              voice: voiceEnum.parse(value),
            })
          }
          value={audioSettings.voice}
        >
          <SelectTrigger id="voice">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(voiceEnum.Values).map((voice) => (
              <SelectItem key={voice} value={String(voice)}>
                {voice}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </fieldset>
      <fieldset className="space-y-1">
        <Label htmlFor="speed">Speed ({audioSettings.speed}x)</Label>
        <Slider
          max={4}
          min={0.25}
          onValueChange={(values) =>
            setAudioSettings({ ...audioSettings, speed: values[0] ?? 1 })
          }
          step={0.1}
          value={[audioSettings.speed]}
        />
      </fieldset>
    </div>
  );
}
