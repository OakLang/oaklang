/* eslint-disable react/jsx-max-depth */
'use client';

import { SentenceWithId } from '@acme/validators';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { SettingsIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import InterlinearList from '~/components/InterlinearList';
import SettingsForm from '~/components/SettingsForm';
import WordsList from '~/components/WordsList';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { useHotkeysTooltipProps } from '~/hooks/useHotkeysTooltipProps';
import { knownIPAsAtom, knownTranslationsAtom, knownVocabsAtom, practiceVocabsAtom, sentencesGeneratorSettingsAtom } from '~/store';
import { showHotkeysAtom } from '~/store/show-tooltips';
import { api } from '~/trpc/react';

export default function HomePage() {
  const [sentences, setSentences] = useState<SentenceWithId[]>([]);
  const sentencesGeneratorSettings = useAtomValue(sentencesGeneratorSettingsAtom);
  const [practiceVocabs, setPracticeVocabs] = useAtom(practiceVocabsAtom);
  const [knownVocabs, setKnownVocabs] = useAtom(knownVocabsAtom);
  const [password, setPassword] = useState('');
  const [canAccess, setCanAccess] = useState(process.env.NODE_ENV === 'development');
  const setKnownIPAs = useSetAtom(knownIPAsAtom);
  const setKnownTranslations = useSetAtom(knownTranslationsAtom);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trainingStarted, setTrainingStarted] = useState(false);
  const startBtnTooltipProps = useHotkeysTooltipProps();
  const nextBtnTooltipProps = useHotkeysTooltipProps();
  const previousBtnTooltipProps = useHotkeysTooltipProps();
  const helpBtnTooltipProps = useHotkeysTooltipProps();
  const settingsBtnTooltipProps = useHotkeysTooltipProps();
  const setShowHotkeys = useSetAtom(showHotkeysAtom);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const generateSentencesMut = api.ai.generateSentences.useMutation({
    onError: (error) => {
      toast('Failed to generate Sentences', { description: error.message });
    },
    onSuccess: (data) => {
      setSentences((sentences) => [...sentences, ...data]);
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
    generateSentencesMut.mutate({ knownVocabs, practiceVocabs, settings: sentencesGeneratorSettings });
  }, [generateSentencesMut, knownVocabs, practiceVocabs, sentencesGeneratorSettings]);

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

  const handleHelp = useCallback(() => {
    setKnownIPAs([]);
    setKnownTranslations([]);
  }, [setKnownIPAs, setKnownTranslations]);

  useHotkeys(
    'space',
    () => {
      handleStartTraining();
    },
    { enabled: !settingsOpen && !trainingStarted },
  );

  useHotkeys(
    'ctrl',
    () => {
      setShowHotkeys(true);
    },
    { enabled: !settingsOpen, keydown: true },
  );

  useHotkeys(
    'ctrl',
    () => {
      setShowHotkeys(false);
    },
    { enabled: !settingsOpen, keyup: true },
  );

  useHotkeys(
    'n',
    () => {
      void handleNext();
    },
    { enabled: !settingsOpen },
  );

  useHotkeys(
    'p',
    () => {
      void handlePrevious();
    },
    { enabled: !settingsOpen },
  );

  useHotkeys(
    'h',
    () => {
      void handleHelp();
    },
    { enabled: !settingsOpen },
  );

  useHotkeys(
    's',
    () => {
      setSettingsOpen(true);
    },
    { enabled: !settingsOpen },
  );

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
          {trainingStarted ? (
            <Button onClick={handleRestart} variant="outline">
              Restart
            </Button>
          ) : null}

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

          <Sheet onOpenChange={setSettingsOpen} open={settingsOpen}>
            <Tooltip {...settingsBtnTooltipProps}>
              <TooltipTrigger asChild>
                <SheetTrigger asChild>
                  <Button size="icon" variant="outline">
                    <SettingsIcon className="h-5 w-5" />
                    <p className="sr-only">Settings</p>
                  </Button>
                </SheetTrigger>
              </TooltipTrigger>
              <TooltipContent>Hotkey: S(ettings)</TooltipContent>
            </Tooltip>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
              </SheetHeader>
              <SettingsForm />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="container my-8 px-4">
        {trainingStarted ? (
          <div>
            {sentences[currentIndex] ? <InterlinearList sentence={sentences[currentIndex]!} /> : <p>Loading...</p>}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-10">
              <Tooltip {...helpBtnTooltipProps}>
                <TooltipTrigger asChild>
                  <Button onClick={handleHelp} variant="outline">
                    Help 100%
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hotkey: H(elp)</TooltipContent>
              </Tooltip>
              <Tooltip {...previousBtnTooltipProps}>
                <TooltipTrigger asChild>
                  <Button onClick={handlePrevious}>Previous</Button>
                </TooltipTrigger>
                <TooltipContent>Hotkey: P(revious)</TooltipContent>
              </Tooltip>
              <Tooltip {...nextBtnTooltipProps}>
                <TooltipTrigger asChild>
                  <Button onClick={handleNext}>Next</Button>
                </TooltipTrigger>
                <TooltipContent>Hotkey: N(ext)</TooltipContent>
              </Tooltip>
            </div>
            <p>
              Total Sentences: {sentences.length}, Current Sentence: {currentIndex + 1}
              {generateSentencesMut.isPending ? ', Generating more sentences...' : ''}
            </p>
          </div>
        ) : (
          <div className="my-8 flex items-center justify-center">
            <Tooltip {...startBtnTooltipProps}>
              <TooltipTrigger asChild>
                <Button onClick={handleStartTraining}>Start Training</Button>
              </TooltipTrigger>
              <TooltipContent>Hotkey: Space</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </>
  );
}
