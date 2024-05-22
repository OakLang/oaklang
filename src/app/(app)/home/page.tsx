'use client';

import { useCallback, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';

const languages = [
  {
    id: 'en',
    isActive: true,
    name: 'English',
    nativeName: 'English',
  },
  {
    id: 'es',
    isActive: true,
    name: 'Spanish',
    nativeName: 'Español',
  },
  {
    id: 'fr',
    isActive: true,
    name: 'French',
    nativeName: 'Français',
  },
];

export default function HomePage() {
  const [helpLanguage, setHelpLanguage] = useState(languages[0]!.id);
  const [practiceLanguage, setPracticeLanguage] = useState(languages[1]!.id);
  const [practiceVocabs, setPracticeVocabs] = useState<string[]>([]);
  const [knownVocabs, setKnownVocabs] = useState<string[]>([]);

  const handleStartTraining = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/test', {
        body: JSON.stringify({
          helpLanguage,
          knownVocabs,
          practiceLanguage,
          practiceVocabs,
        }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      });
      if (!res.ok) {
        throw res.statusText;
      }
      const data = await res.json();
      console.log(data);
    } catch (error: unknown) {
      console.error(error);
    }
  }, [helpLanguage, knownVocabs, practiceLanguage, practiceVocabs]);

  return (
    <>
      <div className="flex items-center justify-end gap-4 px-4">
        <fieldset>
          <Label htmlFor="help-language">Help Language</Label>
          <Select onValueChange={setHelpLanguage} value={helpLanguage}>
            <SelectTrigger id="help-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language.id} value={language.id}>
                  {language.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </fieldset>
        <fieldset>
          <Label htmlFor="practice-language">Practice Language</Label>
          <Select onValueChange={setPracticeLanguage} value={practiceLanguage}>
            <SelectTrigger id="practice-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language.id} value={language.id}>
                  {language.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </fieldset>
        <Button variant="outline">Practice Vocab</Button>
        <Button variant="outline">Known Vocab</Button>
      </div>
      <p>Practice Page</p>
      <Button onClick={handleStartTraining}>Start Training</Button>
    </>
  );
}
