"use client";

import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { toast } from "sonner";

import type { Sentence } from "@acme/db/schema";

import type { TrainingSessionParams } from "~/types";
import { useAppStore } from "~/store/app-store";
import { api } from "~/trpc/react";
import { cn } from "~/utils";
import AudioPlayButton from "./AudioPlayButton";
import InterlinearLineSentence from "./InterlinearLineSentence";
import { Button } from "./ui/button";

export default function InterlinearView({
  sentences,
  onNextSentence,
}: {
  sentences: Sentence[];
  onNextSentence?: () => void;
  onPreviousSentence?: () => void;
}) {
  const { trainingSessionId, languageCode } =
    useParams<TrainingSessionParams>();
  const [showTranslation, setShowTranslation] = useState(false);
  const trainingSessionQuery = api.trainingSessions.getTrainingSession.useQuery(
    { trainingSessionId },
  );

  const setInspectedWord = useAppStore((state) => state.setInspectedWord);

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
      const words = (
        await Promise.all(
          sentences.map((sentence) =>
            utils.sentences.getSentence.fetch({ sentenceId: sentence.id }),
          ),
        )
      ).flatMap((sentence) => sentence.words);
      await Promise.all(
        words.map(async (word) => {
          await markWordKnownMut.mutateAsync({
            wordId: word.wordId,
            sessionId: trainingSessionId,
          });
        }),
      );
      words.forEach((word) => {
        void utils.words.getUserWord.invalidate({ wordId: word.wordId });
      });
      void utils.languages.getPracticeLanguage.invalidate({
        languageCode,
      });
      void utils.languages.getPracticeLanguages.invalidate();
      onNextSentence?.();
    } catch (error) {
      toast((error as Error).message);
    }
  }, [
    languageCode,
    markWordKnownMut,
    onNextSentence,
    sentences,
    trainingSessionId,
    utils.languages.getPracticeLanguage,
    utils.languages.getPracticeLanguages,
    utils.sentences.getSentence,
    utils.words.getUserWord,
  ]);

  useEffect(() => {
    setShowTranslation(false);
  }, [translation]);

  return (
    <div ref={ref} onClick={onBodyClick} className="flex-1">
      <div className="pointer-events-none">
        {sentences.map((sentence) => (
          <InterlinearLineSentence key={sentence.id} sentence={sentence} />
        ))}
      </div>

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
          >
            Mark all Words Known and Next
            <ArrowRightIcon className="-mr-1 ml-2 h-4 w-4" />
          </Button>
        </div>
        {showTranslation && (
          <div className="text-muted-foreground bg-muted/50 pointer-events-auto mt-2 flex gap-4 overflow-hidden rounded-lg p-2">
            <AudioPlayButton value={translation} variant="outline" />
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
