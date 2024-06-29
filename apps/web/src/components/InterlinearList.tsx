import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import { Loader2, PlayIcon, SquareIcon } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";

import type { Sentence } from "@acme/db/schema";
import type { AudioSettings } from "@acme/validators";

import type { TTSBodyParams } from "~/app/api/ai/tts/route";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { useHotkeysTooltipProps } from "~/hooks/useHotkeysTooltipProps";
import { useTrainingSession } from "~/providers/TrainingSessionProvider";
import {
  audioSettingsAtom,
  knownIPAsAtom,
  knownTranslationsAtom,
} from "~/store";
import { cn } from "~/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const generateAudioAsync = async ({
  input,
  settings,
}: {
  input: string;
  settings: AudioSettings;
}) => {
  console.log("Fetching Audio...");
  const body: TTSBodyParams = {
    input,
    settings,
  };
  const res = await fetch("/api/ai/tts", {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  if (!res.ok) {
    throw res.statusText;
  }
  const buffer = await res.arrayBuffer();
  const blob = new Blob([buffer], { type: "audio/mp3" });
  return URL.createObjectURL(blob);
};

export default function InterlinearList({ sentence }: { sentence: Sentence }) {
  const { knownWords, setKnownWords, practiceWords, setPracticeWords } =
    useTrainingSession();
  const [knownIPAs, setKnownIPAs] = useAtom(knownIPAsAtom);
  const [knownTranslations, setKnownTranslations] = useAtom(
    knownTranslationsAtom,
  );
  const [isPaused, setIsPaused] = useState(true);
  const audioSettings = useAtomValue(audioSettingsAtom);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playCount, setPlayCount] = useState(0);
  const playBtmTooltipProps = useHotkeysTooltipProps();
  const [addedWordsToPracticeList, setAddedWordsToPracticeList] =
    useState(false);

  const audioQuery = useQuery({
    enabled: audioSettings.autoPlay,
    queryFn: () =>
      generateAudioAsync({ input: sentence.sentence, settings: audioSettings }),
    queryKey: [sentence.sentence, audioSettings],
    staleTime: 1000 * 60 * 60, // 1h
  });

  const playAudio = useCallback(async () => {
    if (!audioRef.current) {
      return;
    }

    let audioUrl: string | undefined = audioQuery.data;
    if (!audioUrl && audioQuery.fetchStatus === "idle") {
      const { data } = await audioQuery.refetch();
      audioUrl = data;
    }

    if (!audioUrl) {
      return;
    }

    audioRef.current.src = audioUrl;
    audioRef.current.currentTime = 0;
    void audioRef.current.play();
  }, [audioQuery]);

  const pauseAudio = useCallback(() => {
    if (!audioRef.current) {
      return;
    }
    audioRef.current.pause();
  }, []);

  useHotkeys("r", () => {
    void playAudio();
  });

  useEffect(() => {
    if (addedWordsToPracticeList) {
      return;
    }
    const uniqueWords = sentence.words
      .map((item) => item.lemma)
      .filter((word) => !practiceWords.includes(word));
    setPracticeWords([...practiceWords, ...uniqueWords]);
    setAddedWordsToPracticeList(true);
  }, [
    addedWordsToPracticeList,
    practiceWords,
    sentence.words,
    setPracticeWords,
  ]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) {
      return;
    }

    const onPlay = () => {
      setPlayCount((count) => count + 1);
      setIsPaused(false);
    };

    const onPause = () => {
      setIsPaused(true);
    };

    audioEl.addEventListener("play", onPlay);
    audioEl.addEventListener("pause", onPause);

    return () => {
      audioEl.removeEventListener("play", onPlay);
      audioEl.removeEventListener("pause", onPause);
    };
  }, []);

  useEffect(() => {
    setAddedWordsToPracticeList(false);
    setPlayCount(0);
    pauseAudio();
  }, [pauseAudio, sentence.id]);

  useEffect(() => {
    if (audioQuery.data && audioSettings.autoPlay && playCount === 0) {
      void playAudio();
    }
  }, [audioSettings.autoPlay, audioQuery.data, playAudio, playCount]);

  return (
    <div className="flex gap-6">
      <audio ref={audioRef} />
      <Tooltip {...playBtmTooltipProps}>
        <TooltipTrigger asChild>
          <button
            className="hover:bg-secondary border-foreground flex h-12 w-12 items-center justify-center rounded-full border-2"
            disabled={audioQuery.isFetching}
            onClick={() => {
              if (isPaused) {
                void playAudio();
              } else {
                pauseAudio();
              }
            }}
            type="button"
          >
            {audioQuery.isFetching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPaused ? (
              <PlayIcon className="h-5 w-5" />
            ) : (
              <SquareIcon className="h-5 w-5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>Hotkey: R(eplay)</TooltipContent>
      </Tooltip>
      <div className="relative flex flex-1 flex-wrap gap-x-4 gap-y-6">
        {sentence.words.map((item, i) => {
          const id = `${item.word}-${i}`;
          const vocabKnown = knownWords.includes(item.lemma);
          return (
            <ListItem
              ipa={item.ipa}
              ipaHidden={knownIPAs.includes(item.ipa)}
              key={id}
              onHideIPA={() => setKnownIPAs([...knownIPAs, item.ipa])}
              onHideTranslation={() =>
                setKnownTranslations([...knownTranslations, item.translation])
              }
              onMarkVocabKnown={() =>
                setKnownWords([...knownWords, item.lemma])
              }
              onMarkVocabUnknown={() =>
                setKnownWords(knownWords.filter((word) => word !== item.lemma))
              }
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
    <div className="flex flex-col gap-3">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            className="block text-left font-serif text-5xl font-semibold"
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
            <ContextMenuItem onClick={onMarkVocabUnknown}>
              Mark word unknown
            </ContextMenuItem>
          ) : (
            <ContextMenuItem onClick={onMarkVocabKnown}>
              Mark word known
            </ContextMenuItem>
          )}
          <ContextMenuItem>
            <Link
              href={{
                host: "en.wiktionary.org/w/index.php",
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
        className={cn(
          "text-muted-foreground block text-left font-serif text-2xl italic transition-opacity",
          {
            invisible: ipaHidden && !revealIpa,
          },
        )}
        onClick={() => {
          onHideIPA();
          setRevealIpa(false);
        }}
        type="button"
      >
        {ipa}
      </button>
      <button
        className={cn(
          "text-muted-foreground block text-left font-serif text-2xl transition-opacity",
          {
            invisible: translationHidden && !revealTranslation,
          },
        )}
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
