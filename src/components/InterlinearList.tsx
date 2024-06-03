import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Loader2, PlayIcon, SquareIcon } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { TTSBodyParams } from '~/app/api/ai/tts/route';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '~/components/ui/context-menu';
import { audioSettingsAtom, knownIPAsAtom, knownTranslationsAtom, knownVocabsAtom, practiceVocabsAtom } from '~/store';
import { cn } from '~/utils';
import type { Sentence } from '~/validators/generate-sentence';

export default function InterlinearList({ sentence }: { sentence: Sentence }) {
  const setPracticeVocabs = useSetAtom(practiceVocabsAtom);
  const [knownVocabs, setKnownVocabs] = useAtom(knownVocabsAtom);
  const [knownIPAs, setKnownIPAs] = useAtom(knownIPAsAtom);
  const [knownTranslations, setKnownTranslations] = useAtom(knownTranslationsAtom);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isAudioGenerated, setIsAudioGenerated] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const audioSettings = useAtomValue(audioSettingsAtom);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handlePlayClick = useCallback(async () => {
    if (!audioRef.current) {
      return;
    }

    if (!isAudioGenerated) {
      setIsLoadingAudio(true);
      console.log('Generating TTS');
      try {
        const input = sentence.sentence;
        const body: TTSBodyParams = {
          input,
          settings: audioSettings,
        };
        const controller = new AbortController();
        abortControllerRef.current = controller;
        const res = await fetch('/api/ai/tts', {
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          signal: controller.signal,
        });
        if (!res.ok) {
          throw res.statusText;
        }
        const buffer = await res.arrayBuffer();
        const blob = new Blob([buffer], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        audioRef.current.src = url;
        setIsAudioGenerated(true);
      } catch (error: unknown) {
        toast('Failed to generate TTS', { description: (error as { message?: string }).message });
        return;
      } finally {
        setIsLoadingAudio(false);
      }
    }

    if (audioRef.current.paused) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [audioSettings, isAudioGenerated, sentence.sentence]);

  useEffect(() => {
    setPracticeVocabs((practiceVocabs) => {
      const uniqueVocabs = sentence.words.map((item) => item.lemma).filter((vocab) => !practiceVocabs.includes(vocab));
      return [...practiceVocabs, ...uniqueVocabs];
    });
  }, [sentence.words, setPracticeVocabs]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) {
      return;
    }

    const onPlay = () => {
      setIsPaused(false);
    };

    const onPause = () => {
      setIsPaused(true);
    };

    audioEl.addEventListener('play', onPlay);
    audioEl.addEventListener('pause', onPause);

    return () => {
      audioEl.removeEventListener('play', onPlay);
      audioEl.removeEventListener('pause', onPause);
    };
  }, [sentence.sentence]);

  useEffect(() => {
    setIsAudioGenerated(false);
    setIsPaused(true);
    audioRef.current?.pause();
    abortControllerRef.current?.abort();
  }, [sentence.sentence, audioSettings.speed, audioSettings.voice]);

  return (
    <div className="flex gap-4">
      <audio key={sentence.sentence} ref={audioRef} />
      <button
        className="flex h-12 w-12 items-center justify-center rounded-full border hover:bg-secondary"
        disabled={isLoadingAudio}
        onClick={handlePlayClick}
        type="button"
      >
        {isLoadingAudio ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isPaused ? (
          <PlayIcon className="h-5 w-5" />
        ) : (
          <SquareIcon className="h-5 w-5" />
        )}
      </button>
      <div className="relative flex flex-1 flex-wrap gap-x-4 gap-y-6">
        {sentence.words.map((item, i) => {
          const id = `${item.word}-${i}`;
          const vocabKnown = knownVocabs.includes(item.lemma);
          return (
            <ListItem
              ipa={item.ipa}
              ipaHidden={knownIPAs.includes(item.ipa)}
              key={id}
              onHideIPA={() => setKnownIPAs([...knownIPAs, item.ipa])}
              onHideTranslation={() => setKnownTranslations([...knownTranslations, item.translation])}
              onMarkVocabKnown={() => setKnownVocabs([...knownVocabs, item.lemma])}
              onMarkVocabUnknown={() => setKnownVocabs(knownVocabs.filter((vocab) => vocab !== item.lemma))}
              translation={item.translation}
              translationHidden={knownTranslations.includes(item.translation)}
              vocab={item.word}
              vocabKnown={vocabKnown}
            />
          );
        })}
      </div>
    </div>
  );
}

const ListItem = ({
  ipa,
  onHideIPA,
  onHideTranslation,
  translation,
  vocab,
  ipaHidden,
  translationHidden,
  onMarkVocabKnown,
  onMarkVocabUnknown,
  vocabKnown,
}: {
  ipa: string;
  ipaHidden?: boolean;
  onHideIPA: () => void;
  onHideTranslation: () => void;
  onMarkVocabKnown: () => void;
  onMarkVocabUnknown: () => void;
  translation: string;
  translationHidden?: boolean;
  vocab: string;
  vocabKnown?: boolean;
}) => {
  const [revealIpa, setRevealIpa] = useState(false);
  const [revealTranslation, setRevealTranslation] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            className="block text-left font-serif text-4xl font-medium"
            onClick={() => {
              setRevealIpa(true);
              setRevealTranslation(true);
            }}
            type="button"
          >
            {vocab}
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {/* <ContextMenuItem>Repeat word</ContextMenuItem> */}
          {vocabKnown ? (
            <ContextMenuItem onClick={onMarkVocabUnknown}>Mark word unknown</ContextMenuItem>
          ) : (
            <ContextMenuItem onClick={onMarkVocabKnown}>Mark word known</ContextMenuItem>
          )}
          <ContextMenuItem>
            <Link
              href={{
                host: 'en.wiktionary.org/w/index.php',
                query: {
                  title: vocab,
                },
              }}
              rel="noopener nofollow"
              target="_blank"
            >
              Search Wiktionary for &apos;{vocab}&apos;
            </Link>
          </ContextMenuItem>
          {/* <ContextMenuItem>More Practice</ContextMenuItem> */}
        </ContextMenuContent>
      </ContextMenu>
      <button
        className={cn('block text-left font-serif text-xl text-muted-foreground transition-opacity', {
          invisible: ipaHidden && !revealIpa,
        })}
        onClick={() => {
          onHideIPA();
          setRevealIpa(false);
        }}
        type="button"
      >
        {ipa}
      </button>
      <button
        className={cn('block text-left font-serif text-xl text-muted-foreground transition-opacity', {
          invisible: translationHidden && !revealTranslation,
        })}
        onClick={() => {
          onHideTranslation();
          setRevealTranslation(false);
        }}
        type="button"
      >
        {translation}
      </button>
    </div>
  );
};
