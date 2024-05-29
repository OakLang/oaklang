import { range } from '~/utils/helpers';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { complexityEnum } from '~/validators/settings';
import type { Complexity, Settings } from '~/validators/settings';
import { LANGUAGES } from '~/utils/constants/languages';

export type Props = {
  onChange: (settings: Settings) => void;
  settings: Settings;
};

const COMPLEXITIES: Complexity[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function SettingsForm({ onChange, settings }: Props) {
  return (
    <div className="space-y-4 py-4">
      <fieldset className="space-y-1">
        <Label htmlFor="prompt-template">Propmt Template</Label>
        <Textarea
          id="prompt-template"
          onChange={(e) => onChange({ ...settings, prompt: e.target.value })}
          rows={5}
          value={settings.prompt}
        />
      </fieldset>
      <fieldset className="space-y-1">
        <Label htmlFor="help-language">Help Language</Label>
        <Select onValueChange={(value) => onChange({ ...settings, helpLanguage: value })} value={settings.helpLanguage}>
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
        <Select onValueChange={(value) => onChange({ ...settings, practiceLanguage: value })} value={settings.practiceLanguage}>
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
        <Select onValueChange={(value) => onChange({ ...settings, sentencesCount: Number(value) })} value={String(settings.sentencesCount)}>
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
        <Select onValueChange={(value) => onChange({ ...settings, complexity: complexityEnum.parse(value) })} value={settings.complexity}>
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
    </div>
  );
}
