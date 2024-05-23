'use client';

import { Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import InterlinearList from '~/components/InterlinearList';
import WordsList from '~/components/WordsList';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Textarea } from '~/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { api } from '~/trpc/client';
import { range } from '~/utils/helpers';
import type { GenerateSentenceApiResponse, GenerateSentenceBody, Sentence } from '~/validators/generate-sentence';

const languages = [
  {
    id: 'en',
    name: 'English',
  },
  {
    id: 'es',
    name: 'Spanish',
  },
  {
    id: 'fr',
    name: 'French',
  },
];

const DEFAULT_PROMPT = `Please provide a series of {{SENTENCE_COUNT}} sentences suitable for an A1 HELP LANGUAGE student composing a story using each of the following words. I want to practice at least {{NUMBER_OF_TIME_TO_PRACTICE}} times using only words from PRACTICE VOCABS and the KNOWN VOCABS List below. Sentences should be constructed so it is hard to replace the focus word with another (ie, "the RED apple" is better than "the RED paper" since apples are often associated with the color red).

PRACTICE LANGUAGE: "{{PRACTICE_LANGUAGE}}"

HELP LANGUAGE: "{{HELP_LANGUAGE}}"

PRACTICE VOCABS: "{{PRACTICE_VOCABS}}"

KNOWN VOCABS: "{{KNOWN_VOCABS}}"`;

export default function HomePage() {
  const [helpLanguage, setHelpLanguage] = useState(languages[0]!.id);
  const [practiceLanguage, setPracticeLanguage] = useState(languages[1]!.id);
  const [practiceVocabs, setPracticeVocabs] = useState<string[]>([]);
  const [knownVocabs, setKnownVocabs] = useState<string[]>([]);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [sentencesCount, setSentencesCount] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [password, setPassword] = useState('');
  const [canAccess, setCanAccess] = useState(false);
  const checkPassMut = api.checkPassword.useMutation({
    onSuccess: (data) => {
      if (data) {
        setCanAccess(true);
        setPassword('');
      } else {
        toast('Wrong password');
      }
    },
  });

  const handleStartTraining = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/ai/generate-sentences', {
        body: JSON.stringify({
          helpLanguage: languages.find((lang) => lang.id === helpLanguage)!.name,
          knownVocabs,
          numberOfTimeToPractice: 5,
          practiceLanguage: languages.find((lang) => lang.id === practiceLanguage)!.name,
          practiceVocabs,
          prompt,
          sentencesCount,
        } satisfies GenerateSentenceBody),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      });
      if (res.status !== 200) {
        throw res.statusText;
      }
      const data = (await res.json()) as GenerateSentenceApiResponse;
      console.log(data);
      setPracticeVocabs(data.practiceVocabs);
      setSentences(data.sentences);
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [helpLanguage, knownVocabs, practiceLanguage, practiceVocabs, prompt, sentencesCount]);

  if (!canAccess) {
    return (
      <div className="container my-16 max-w-screen-sm">
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            checkPassMut.mutate(password);
          }}
        >
          <Input onChange={(e) => setPassword(e.currentTarget.value)} placeholder="Password" type="text" value={password} />
          <Button disabled={checkPassMut.isPending}>Log In</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="container my-8 px-4">
      <fieldset className="space-y-1">
        <Label htmlFor="prompt-template">Propmt Template</Label>
        <Textarea id="prompt-template" onChange={(e) => setPrompt(e.target.value)} rows={5} value={prompt} />
      </fieldset>
      <div className="my-4 flex items-end gap-4">
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
        <fieldset>
          <Label htmlFor="practice-language">Num of Sentences</Label>
          <Select onValueChange={(value) => setSentencesCount(Number(value))} value={String(sentencesCount)}>
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
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="outline">Practice Vocabs</Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>{practiceVocabs.length ? practiceVocabs.join(', ') : 'No Practice Vocabs'}</TooltipContent>
            <PopoverContent>
              <WordsList onWordsChange={setPracticeVocabs} title="Practice Vocabs" words={practiceVocabs} />
            </PopoverContent>
          </Tooltip>
        </Popover>
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="outline">Known Vocabs</Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>{knownVocabs.length ? knownVocabs.join(', ') : 'No Known Vocabs'}</TooltipContent>
            <PopoverContent>
              <WordsList onWordsChange={setKnownVocabs} title="Known Vocabs" words={knownVocabs} />
            </PopoverContent>
          </Tooltip>
        </Popover>
      </div>
      <div className="my-4">
        <Button disabled={isLoading} onClick={handleStartTraining}>
          {isLoading ? <Loader2 className="-ml-1 mr-2 h-5 w-5 animate-spin" /> : null}
          Generate Sentences
        </Button>
      </div>
      <div className="my-8">
        <InterlinearList knownWords={knownVocabs} onKnownWordsChange={setKnownVocabs} sentences={sentences} />
      </div>
      <div className="my-8">
        <pre className="overflow-x-auto rounded-md bg-secondary p-4">
          {JSON.stringify({ knownVocabs, practiceVocabs, sentences }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
