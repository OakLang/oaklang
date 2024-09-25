"use client";

import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronDownIcon, ExternalLinkIcon } from "lucide-react";

import type { SentenceWithWords } from "@acme/api/validators";
import type { InterlinearLine } from "@acme/core/validators";

import { Link } from "~/i18n/routing";
import { useAppStore } from "~/providers/app-store-provider";
import { api } from "~/trpc/react";
import { cn, getCSSStyleForInterlinearLine } from "~/utils";
import AudioPlayButton from "./AudioPlayButton";
import { Button } from "./ui/button";

const PRIMARY_LINE_NAME = "word";

export default function InterlinearView({
  sentences,
}: {
  sentences: SentenceWithWords[];
}) {
  const [showTranslation, setShowTranslation] = useState(false);
  const { trainingSessionId } = useParams<{ trainingSessionId: string }>();
  const trainingSessionQuery =
    api.trainingSessions.getTrainingSession.useQuery(trainingSessionId);

  const setInspectedWordId = useAppStore((state) => state.setInspectedWordId);
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();

  const ref = useRef<HTMLDivElement>(null);

  const translation = useMemo(
    () => sentences.map((sent) => sent.translation).join(" "),
    [sentences],
  );

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === ref.current) {
      setInspectedWordId(null);
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

  useEffect(() => {
    setShowTranslation(false);
  }, [translation]);

  return (
    <div ref={ref} onClick={onClick} className="flex-1">
      <p className="pointer-events-none">
        {sentences.map((sentence) =>
          sentence.sentenceWords.map((word) => {
            return (
              <LineWord
                key={`${sentence.id}-${word.wordId}-${word.index}`}
                word={word}
              />
            );
          }),
        )}
      </p>

      <div className="pointer-events-none mt-4">
        <Button
          variant="ghost"
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

function LineWord({
  word,
}: {
  word: SentenceWithWords["sentenceWords"][number];
}) {
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();

  const fontSize = useAppStore((state) => state.fontSize);
  const inspectedWordId = useAppStore((state) => state.inspectedWordId);
  const setInspectedWordId = useAppStore((state) => state.setInspectedWordId);

  const onClick = useCallback(
    (line: InterlinearLine) => {
      if (line.name === PRIMARY_LINE_NAME) {
        setInspectedWordId(word.wordId);
      }
    },
    [setInspectedWordId, word.wordId],
  );

  return (
    <span className="mb-4 mr-4 inline-flex flex-col items-center gap-2">
      {userSettingsQuery.data?.interlinearLines
        .filter((line) => !line.hidden)
        .map((line) => {
          const value = word.interlinearLines[line.name];
          const isPrimaryLine = line.name === PRIMARY_LINE_NAME;

          return (
            <span
              className={cn(
                "hover:ring-primary/50 pointer-events-auto clear-both cursor-pointer whitespace-nowrap rounded-md px-[4px] py-[2px] text-center leading-none ring-1 ring-transparent transition-colors duration-200",
                {
                  "ring-2 ring-yellow-400 hover:ring-yellow-400":
                    inspectedWordId &&
                    inspectedWordId === word.word.id &&
                    isPrimaryLine,
                  "opacity-80": !isPrimaryLine,
                },
                isPrimaryLine
                  ? "text-[1.75em] leading-none"
                  : "text-[1em] leading-none",
              )}
              style={{
                ...getCSSStyleForInterlinearLine(line),
                fontSize: line.style.fontSize * (fontSize / 16),
              }}
              onClick={() => onClick(line)}
            >
              {value}
            </span>
          );
        })}
    </span>
  );
}
