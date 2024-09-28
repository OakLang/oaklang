"use client";

import type { MouseEvent } from "react";
import type { z } from "zod";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowRight, ChevronDownIcon, ExternalLinkIcon } from "lucide-react";
import { toast } from "sonner";

import type {
  InterlinearLine,
  interlinearLineActionSchema,
} from "@acme/core/validators";
import type { Sentence, SentenceWord } from "@acme/db/schema";
import { InterlinearLineAction } from "@acme/core/validators";

import { useDoubleClick } from "~/hooks/useDoubleClick";
import { usePracticeLanguageCode } from "~/hooks/usePracticeLanguageCode";
import { useTrainingSessionId } from "~/hooks/useTrainingSessionId";
import { Link } from "~/i18n/routing";
import { useAppStore } from "~/providers/app-store-provider";
import { api } from "~/trpc/react";
import { cn, getCSSStyleForInterlinearLine } from "~/utils";
import AudioPlayButton from "./AudioPlayButton";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export default function InterlinearView({
  sentences,
  onNextSentence,
}: {
  sentences: Sentence[];
  onNextSentence?: () => void;
  onPreviousSentence?: () => void;
}) {
  const practiceLanguage = usePracticeLanguageCode();
  const [showTranslation, setShowTranslation] = useState(false);
  const trainingSessionId = useTrainingSessionId();
  const trainingSessionQuery =
    api.trainingSessions.getTrainingSession.useQuery(trainingSessionId);

  const setInspectedWord = useAppStore((state) => state.setInspectedWord);
  const generateSentenceWordsPromptTemplate = useAppStore(
    (state) => state.generateSentenceWordsPromptTemplate,
  );

  const utils = api.useUtils();
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();
  const markWordKnownMut = api.words.markWordKnown.useMutation();

  const ref = useRef<HTMLDivElement>(null);

  const translation = useMemo(
    () => sentences.map((sent) => sent.translation).join(" "),
    [sentences],
  );

  const onBodyClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === ref.current) {
      setInspectedWord(null);
    }
  };

  const handleToggleShowTranslation = useCallback(() => {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }

    // TODO: Do some check here
    setShowTranslation(true);
  }, [showTranslation]);

  const handleMarkAllWordsKnownAndNext = useCallback(async () => {
    try {
      await Promise.all(
        sentences.map(async (sentence) => {
          const words = await utils.sentences.getSentenceWords.fetch({
            sentenceId: sentence.id,
            promptTemplate: generateSentenceWordsPromptTemplate,
          });
          await Promise.all(
            words.map(async (word) => {
              await markWordKnownMut.mutateAsync({ wordId: word.wordId });
              void utils.words.getUserWord.invalidate({ wordId: word.wordId });
            }),
          );
        }),
      );
      void utils.languages.getPracticeLanguage.invalidate(practiceLanguage);
      void utils.languages.getPracticeLanguages.invalidate();
      onNextSentence?.();
    } catch (error) {
      toast((error as Error).message);
    }
  }, [
    sentences,
    utils.languages.getPracticeLanguage,
    utils.languages.getPracticeLanguages,
    utils.sentences.getSentenceWords,
    utils.words.getUserWord,
    practiceLanguage,
    onNextSentence,
    generateSentenceWordsPromptTemplate,
    markWordKnownMut,
  ]);

  useEffect(() => {
    setShowTranslation(false);
  }, [translation]);

  return (
    <div ref={ref} onClick={onBodyClick} className="flex-1">
      <p className="pointer-events-none">
        {sentences.map((sentence) => (
          <SentenceItem key={sentence.id} sentence={sentence} />
        ))}
      </p>

      <div className="pointer-events-none mt-4">
        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            onClick={handleToggleShowTranslation}
            className="text-muted-foreground pointer-events-auto"
          >
            {showTranslation ? "Hide Translation" : "Show Translation"}
            <ChevronDownIcon
              className={cn(
                "-mr-1 ml-2 h-4 w-4 transition-transform duration-200",
                {
                  "-rotate-180": showTranslation,
                },
              )}
            />
          </Button>
          <Button
            variant="outline"
            className="text-muted-foreground pointer-events-auto"
            onClick={handleMarkAllWordsKnownAndNext}
            disabled={markWordKnownMut.isPending}
          >
            Mark all Words Known and Next
            <ArrowRight className="-mr-1 ml-2 h-4 w-4" />
          </Button>
        </div>
        {showTranslation && (
          <div className="text-muted-foreground bg-muted pointer-events-auto mt-2 flex gap-4 overflow-hidden rounded-lg p-2">
            <AudioPlayButton
              text={translation}
              className="h-10 w-10"
              iconSize={20}
            />
            <div className="flex-1">
              <p className="italic">{translation}</p>
              <Button
                variant="link"
                size="sm"
                className="text-muted-foreground hover:text-foreground mt-2 h-fit px-0"
                asChild
              >
                <Link
                  href={`https://translate.google.com/?sl=${trainingSessionQuery.data?.languageCode}&tl=${userSettingsQuery.data?.nativeLanguage}&text=${sentences.map((sent) => sent.sentence).join(" ")}&op=translate`}
                  target="_blank"
                  rel="nofollow noreferrer"
                >
                  Google Translate
                  <ExternalLinkIcon className="-mr-1 ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const SentenceContext = createContext<{ sentence: Sentence } | null>(null);

const SentenceItem = ({ sentence }: { sentence: Sentence }) => {
  const generateSentenceWordsPromptTemplate = useAppStore(
    (state) => state.generateSentenceWordsPromptTemplate,
  );
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();
  const sentenceWordsQuery = api.sentences.getSentenceWords.useQuery({
    sentenceId: sentence.id,
    promptTemplate: generateSentenceWordsPromptTemplate,
  });
  const seenWordMutation = api.words.seenWord.useMutation({
    onError: (error) => {
      toast(error.message);
    },
  });

  const uniqueWordIds = useMemo(() => {
    const wordIds = sentenceWordsQuery.data?.map((word) => word.wordId) ?? [];
    return wordIds.filter(
      (id, i) => wordIds.findIndex((wid) => wid === id) === i,
    );
  }, [sentenceWordsQuery.data]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void Promise.all(
        uniqueWordIds.map((wordId) => seenWordMutation.mutate({ wordId })),
      );
    }, 500);
    return () => {
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueWordIds]);

  if (sentenceWordsQuery.isPending) {
    return new Array(5).fill(0).map((_, i) => (
      <span
        className="mb-16 mr-4 inline-flex flex-col items-center gap-2"
        key={i}
      >
        {userSettingsQuery.data?.interlinearLines.map((line) => (
          <Skeleton
            className="inline"
            style={{
              height: line.style.fontSize,
              width:
                (Math.random() * (40 - 10) + 40) * (line.style.fontSize / 16),
            }}
            key={line.id}
          />
        ))}
      </span>
    ));
  }

  if (sentenceWordsQuery.isError) {
    return <p>{sentenceWordsQuery.error.message}</p>;
  }

  return (
    <SentenceContext.Provider value={{ sentence }}>
      {sentenceWordsQuery.data.map((word) => {
        return <InterlinearLineColumn key={word.index} word={word} />;
      })}
    </SentenceContext.Provider>
  );
};

function InterlinearLineColumn({ word }: { word: SentenceWord }) {
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();

  return (
    <span className="mb-16 mr-4 inline-flex flex-col items-center gap-2">
      {userSettingsQuery.data?.interlinearLines
        .filter((line) => !line.hidden)
        .map((line) => {
          return <InterlinearLineRow line={line} word={word} />;
        })}
    </span>
  );
}

const InterlinearLineRow = ({
  line,
  word,
}: {
  line: InterlinearLine;
  word: SentenceWord;
}) => {
  const sentenceCtx = useContext(SentenceContext);
  const fontSize = useAppStore((state) => state.fontSize);
  const setInspectedWord = useAppStore((state) => state.setInspectedWord);
  const practiceLanguage = usePracticeLanguageCode();
  const [showLinePopover, setShowLinePopover] = useState(false);
  const [popoverLineName, setPopoverLineName] = useState<
    string | null | undefined
  >();

  const utils = api.useUtils();
  const markKnownMut = api.words.markWordKnown.useMutation({
    onMutate: (vars) => {
      utils.words.getUserWord.setData({ wordId: vars.wordId }, (word) =>
        word ? { ...word, knownAt: new Date() } : undefined,
      );
    },
    onSuccess: (_, vars) => {
      void utils.words.getUserWord.invalidate({ wordId: vars.wordId });
      void utils.languages.getPracticeLanguage.invalidate(practiceLanguage);
      void utils.languages.getPracticeLanguages.invalidate();
      toast("Marked Known");
    },
    onError: (error) => {
      toast(error.message);
    },
  });

  const handleAction = useCallback(
    (action: z.infer<typeof interlinearLineActionSchema>) => {
      switch (action.action) {
        case InterlinearLineAction.inspectWord:
          setInspectedWord(word);
          break;
        case InterlinearLineAction.markWordKnown:
          markKnownMut.mutate({ wordId: word.wordId });
          break;
        case InterlinearLineAction.showLineInTooltip:
          setPopoverLineName(action.lineName);
          setShowLinePopover(true);
          break;
        case InterlinearLineAction.readoutLine: {
          const text =
            action.lineName && word.interlinearLines[action.lineName];
          if (text) {
            toast("Reading Out: " + text);
          }
          break;
        }
        case InterlinearLineAction.readoutFullSentence: {
          if (sentenceCtx) {
            toast("Reading Out: " + sentenceCtx.sentence.sentence);
          }
          break;
        }
        default:
          break;
      }
    },
    [setInspectedWord, word, markKnownMut, sentenceCtx],
  );

  const doubleClickProps = useDoubleClick({
    onClick: () => {
      if (line.onClick) {
        handleAction(line.onClick);
      }
    },
    onDoubleClick: () => {
      if (line.onDoubleClick) {
        handleAction(line.onDoubleClick);
      }
    },
  });

  const onMouseEnter = useCallback(
    (e: MouseEvent) => {
      if (line.onHover) {
        e.preventDefault();
        handleAction(line.onHover);
      }
    },
    [handleAction, line.onHover],
  );

  const onMouseLeave = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setShowLinePopover(false);
  }, []);

  return (
    <Tooltip open={showLinePopover}>
      <TooltipTrigger asChild>
        <button
          {...doubleClickProps}
          className={cn(
            "hover:ring-primary/50 pointer-events-auto clear-both cursor-pointer whitespace-nowrap rounded-md px-[4px] py-[2px] text-center leading-none ring-1 ring-transparent transition-colors duration-200 focus:ring-yellow-400",
          )}
          style={{
            ...getCSSStyleForInterlinearLine(line),
            fontSize: line.style.fontSize * (fontSize / 16),
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {word.interlinearLines[line.name] ?? ["-"]}
        </button>
      </TooltipTrigger>
      <TooltipContent align="center" side="bottom">
        {(popoverLineName && word.interlinearLines[popoverLineName]) ??
          "Line not found!"}
      </TooltipContent>
    </Tooltip>
  );
};
