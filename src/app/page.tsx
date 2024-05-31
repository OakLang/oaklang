/* eslint-disable react/jsx-max-depth */
'use client';

import { useAtom, useSetAtom } from 'jotai';
import { SettingsIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import InterlinearList from '~/components/InterlinearList';
import SettingsForm from '~/components/SettingsForm';
import WordsList from '~/components/WordsList';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { knownIPAsAtom, knownTranslationsAtom, knownVocabsAtom, practiceVocabsAtom, settingsAtom } from '~/store';
import { api } from '~/trpc/client';
import type { Sentence } from '~/validators/generate-sentence';

export default function HomePage() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [settings, setSettings] = useAtom(settingsAtom);
  const [practiceVocabs, setPracticeVocabs] = useAtom(practiceVocabsAtom);
  const [knownVocabs, setKnownVocabs] = useAtom(knownVocabsAtom);
  const [password, setPassword] = useState('');
  const [canAccess, setCanAccess] = useState(false);
  const setKnownIPAs = useSetAtom(knownIPAsAtom);
  const setKnownTranslations = useSetAtom(knownTranslationsAtom);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trainingStarted, setTrainingStarted] = useState(false);

  const generateSentencesMut = api.ai.generateSentences.useMutation({
    onError: (error) => {
      toast('Failed to generate Sentences', { description: error.message });
    },
    onSuccess: (data) => {
      setSentences((sentences) => [...sentences, ...data.sentences]);
    },
  });

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

  const handleGenerateSentences = useCallback(() => {
    if (generateSentencesMut.isPending) {
      return;
    }
    generateSentencesMut.mutate({ knownVocabs, practiceVocabs, settings });
  }, [generateSentencesMut, knownVocabs, practiceVocabs, settings]);

  const handleNext = useCallback(() => {
    if (currentIndex >= sentences.length - 3) {
      handleGenerateSentences();
    }
    if (currentIndex >= sentences.length) {
      console.log('Can not go next');
      return;
    }
    setCurrentIndex(currentIndex + 1);
  }, [currentIndex, handleGenerateSentences, sentences.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex <= 0) {
      return;
    }
    setCurrentIndex(currentIndex - 1);
  }, [currentIndex]);

  const handleStartTraining = useCallback(() => {
    setTrainingStarted(true);
    handleGenerateSentences();
  }, [handleGenerateSentences]);

  const handleRestart = () => {
    setKnownIPAs([]);
    setKnownTranslations([]);
    setKnownVocabs([]);
    setPracticeVocabs([]);
    setSentences([]);
    setCurrentIndex(0);
    setTrainingStarted(false);
  };

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
    <>
      <header>
        <div className="container flex h-14 items-center gap-2 px-4">
          <h1 className="text-lg font-semibold">Oaklang</h1>
          <div className="flex-1" />
          <Button onClick={handleRestart} variant="outline">
            Restart
          </Button>

          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="outline">Practice Vocabs</Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>{practiceVocabs.length ? practiceVocabs.join(', ') : 'No Practice Vocabs'}</TooltipContent>
              <PopoverContent className="max-w-lg">
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
              <PopoverContent className="max-w-2xl">
                <WordsList onWordsChange={setKnownVocabs} title="Known Vocabs" words={knownVocabs} />
              </PopoverContent>
            </Tooltip>
          </Popover>

          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <SettingsIcon className="h-5 w-5" />
                <p className="sr-only">Settings</p>
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
              </SheetHeader>
              <SettingsForm onChange={setSettings} settings={settings} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="container my-8 px-4">
        {trainingStarted ? (
          <div>
            {sentences[currentIndex] ? <InterlinearList sentences={[sentences[currentIndex]!]} /> : <p>Loading...</p>}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-2">
              <Button
                onClick={() => {
                  setKnownIPAs([]);
                  setKnownTranslations([]);
                }}
                variant="outline"
              >
                Help 100%
              </Button>
              <Button onClick={handlePrevious}>Previous</Button>
              <Button onClick={handleNext}>Next</Button>
            </div>
            <p>
              Total Sentences: {sentences.length}, Current Sentence: {currentIndex + 1}
              {generateSentencesMut.isPending ? ', Generating more sentences...' : ''}
            </p>
          </div>
        ) : (
          <div className="my-8 flex items-center justify-center">
            <Button onClick={handleStartTraining}>Start Training</Button>
          </div>
        )}
      </div>
    </>
  );
}
