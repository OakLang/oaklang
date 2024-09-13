import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
// import { useAtom } from "jotai";
import { Loader2, PlayIcon, SquareIcon } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";

import type { Sentence } from "@acme/db/schema";

import type { TTSBodyParams } from "~/app/api/ai/tts/route";
import { useHotkeysTooltipProps } from "~/hooks/useHotkeysTooltipProps";
// import { useTrainingSession } from "~/providers/TrainingSessionProvider";
// import { knownIPAsAtom, knownTranslationsAtom } from "~/store";
import { api } from "~/trpc/react";
import { getCSSStyleForInterlinearLine } from "~/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const generateAudioAsync = async ({ input }: { input: string }) => {
  console.log("Fetching Audio...");
  const body: TTSBodyParams = {
    input,
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
  // const { knownWords, setKnownWords, practiceWords, setPracticeWords } =
  //   useTrainingSession();
  // const [knownIPAs, setKnownIPAs] = useAtom(knownIPAsAtom);
  // const [knownTranslations, setKnownTranslations] = useAtom(
  //   knownTranslationsAtom,
  // );
  const [isPaused, setIsPaused] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playCount, setPlayCount] = useState(0);
  const playBtmTooltipProps = useHotkeysTooltipProps();
  const userSettings = api.userSettings.getUserSettings.useQuery();

  const audioQuery = useQuery({
    enabled: userSettings.data?.autoPlayAudio,
    queryFn: () => generateAudioAsync({ input: sentence.sentence }),
    queryKey: [sentence.sentence, userSettings.data?.autoPlayAudio],
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

  // useEffect(() => {
  //   if (addedWordsToPracticeList) {
  //     return;
  //   }
  //   const uniqueWords = sentence.words
  //     .map((item) => item.lemma)
  //     .filter((word) => !practiceWords.find((item) => item.word === word));
  //   setPracticeWords([
  //     ...practiceWords.map((item) => item.word),
  //     ...uniqueWords,
  //   ]);
  //   setAddedWordsToPracticeList(true);
  // }, [
  //   addedWordsToPracticeList,
  //   practiceWords,
  //   sentence.words,
  //   setPracticeWords,
  // ]);

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

  // useEffect(() => {
  //   setAddedWordsToPracticeList(false);
  //   setPlayCount(0);
  //   pauseAudio();
  // }, [pauseAudio, sentence.id]);

  useEffect(() => {
    if (
      audioQuery.data &&
      userSettings.data?.autoPlayAudio &&
      playCount === 0
    ) {
      void playAudio();
    }
  }, [userSettings.data?.autoPlayAudio, audioQuery.data, playAudio, playCount]);

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
          // const vocabKnown = !!knownWords.find(
          //   (word) => word.word === item.lemma,
          // );
          return (
            <ListItem
              key={id}
              item={item}
              // ipa={item.ipa}
              // ipaHidden={knownIPAs.includes(item.ipa)}
              // key={id}
              // onHideIPA={() => setKnownIPAs([...knownIPAs, item.ipa])}
              // onHideTranslation={() =>
              //   setKnownTranslations([...knownTranslations, item.translation])
              // }
              // onMarkVocabKnown={() => {
              //   setKnownWords([
              //     ...knownWords.map((item) => item.word),
              //     item.lemma,
              //   ]);
              // }}
              // onMarkVocabUnknown={() => {
              //   setKnownWords(
              //     knownWords
              //       .map((item) => item.word)
              //       .filter((word) => word !== item.lemma),
              //   );
              // }}
              // translation={item.translation}
              // translationHidden={knownTranslations.includes(item.translation)}
              // vocab={item.word}

              // vocabKnown={vocabKnown}
            />
          );
        })}
      </div>
    </div>
  );
}

const ListItem = ({
  item,
  // onHideIPA,
  // onHideTranslation,
  // translation,
  // vocab,
  // ipaHidden,
  // translationHidden,
  // onMarkVocabKnown,
  // onMarkVocabUnknown,
  // vocabKnown,
}: {
  item: Record<string, string>;
  // ipaHidden?: boolean;
  // onHideIPA: () => void;
  // onHideTranslation: () => void;
  // onMarkVocabKnown: () => void;
  // onMarkVocabUnknown: () => void;
  // translationHidden?: boolean;
  // vocabKnown?: boolean;
}) => {
  // const [revealIpa, setRevealIpa] = useState(false);
  // const [revealTranslation, setRevealTranslation] = useState(false);
  // const [dropdownOpen, setDropdownOpen] = useState(false);
  const userSettings = api.userSettings.getUserSettings.useQuery();

  // const toggleHideOrHelpTranslation = useCallback(() => {
  //   const _ipaHidden = !!ipaHidden && !revealIpa;
  //   const _translationHidden = !!translationHidden && !revealTranslation;
  //   console.log({ _ipaHidden, _translationHidden });
  //   if (_ipaHidden || _translationHidden) {
  //     setRevealIpa(true);
  //     setRevealTranslation(true);
  //   } else {
  //     onHideIPA();
  //     setRevealIpa(false);
  //     onHideTranslation();
  //     setRevealTranslation(false);
  //   }
  // }, [
  //   ipaHidden,
  //   onHideIPA,
  //   onHideTranslation,
  //   revealIpa,
  //   revealTranslation,
  //   translationHidden,
  // ]);

  if (userSettings.isPending) {
    return <p>Loading...</p>;
  }
  if (userSettings.isError) {
    return <p>{userSettings.error.message}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* <DropdownMenu
        modal={false}
        onOpenChange={setDropdownOpen}
        open={dropdownOpen}
      >
        <DropdownMenuTrigger asChild>
          <button
            // className={cn("block text-left font-serif text-5xl font-semibold", {
            //   "bg-blue-500 text-white": dropdownOpen,
            // })}
            type="button"
            style={getCSSStyleForInterlinearLine(
              userSettings.data.interlinearLines.find(
                (item) => item.id === "word",
              )?.style ?? {},
            )}
          >
            {item.word}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom">
          <DropdownMenuItem onClick={toggleHideOrHelpTranslation}>
            Show/Hide Translation
          </DropdownMenuItem>
          {vocabKnown ? (
            <DropdownMenuItem onClick={onMarkVocabUnknown}>
              Mark Word Unknown
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={onMarkVocabKnown}>
              Mark Word Known
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
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
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(vocab)}
          >
            Copy to Clipboard
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu> */}

      {userSettings.data.interlinearLines.map((line) => {
        const value = item[line.name];

        return (
          <button
            key={line.id}
            type="button"
            style={getCSSStyleForInterlinearLine(line.style)}
          >
            {value ?? "-"}
          </button>
        );
      })}
    </div>
  );
};
