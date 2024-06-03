import { range } from '~/utils/helpers';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { complexityEnum } from '~/validators/settings';
import type { Complexity, Settings } from '~/validators/settings';
import { LANGUAGES } from '~/utils/constants/languages';
import { useAtom } from 'jotai';
import { audioSettingsAtom, settingsAtom } from '~/store';
import { voiceEnum } from '~/validators/audio-settings';
import { Slider } from './ui/slider';

export type Props = {
  onChange: (settings: Settings) => void;
  settings: Settings;
};

const COMPLEXITIES: Complexity[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function SettingsForm() {
  const [settings, setSettings] = useAtom(settingsAtom);
  const [audioSettings, setAudioSettings] = useAtom(audioSettingsAtom);
  return (
    <div className="space-y-4 py-4">
      <fieldset className="space-y-1">
        <Label htmlFor="prompt-template">Propmt Template</Label>
        <Textarea
          id="prompt-template"
          onChange={(e) => setSettings({ ...settings, prompt: e.target.value })}
          rows={5}
          value={settings.prompt}
        />
      </fieldset>
      <fieldset className="space-y-1">
        <Label htmlFor="help-language">Help Language</Label>
        <Select onValueChange={(value) => setSettings({ ...settings, helpLanguage: value })} value={settings.helpLanguage}>
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
        <Select onValueChange={(value) => setSettings({ ...settings, practiceLanguage: value })} value={settings.practiceLanguage}>
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
          onValueChange={(value) => setSettings({ ...settings, sentencesCount: Number(value) })}
          value={String(settings.sentencesCount)}
        >
          <SelectTrigger id="practice-language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {range(1, 5).map((count) => (
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
          onValueChange={(value) => setSettings({ ...settings, complexity: complexityEnum.parse(value) })}
          value={settings.complexity}
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
          onValueChange={(value) => setAudioSettings({ ...audioSettings, voice: voiceEnum.parse(value) })}
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
          onValueChange={(values) => setAudioSettings({ ...audioSettings, speed: values[0] ?? 1 })}
          step={0.1}
          value={[audioSettings.speed]}
        />
      </fieldset>
    </div>
  );
}
