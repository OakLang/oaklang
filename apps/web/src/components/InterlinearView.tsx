"use client";

import type { MouseEvent } from "react";
import { useCallback, useRef } from "react";

import type { InterlinearLine } from "@acme/core/validators";
import type { Sentence } from "@acme/db/schema";

import { useTrainingSession } from "~/providers/TrainingSessionProvider";
import { useUserSettings } from "~/providers/UserSettingsProvider";
import { cn, getCSSStyleForInterlinearLine } from "~/utils";

const PRIMARY_LINE_NAME = "word";

export default function InterlinearView({
  sentences,
}: {
  sentences: Sentence[];
}) {
  const { setInspectedWord } = useTrainingSession();
  const { userSettings } = useUserSettings();
  const ref = useRef<HTMLDivElement>(null);

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === ref.current) {
      setInspectedWord(null);
    }
  };

  return (
    <div ref={ref} onClick={onClick} className="flex-1">
      {sentences.map((sentence) =>
        sentence.words.map((word) => {
          return (
            <span className="mb-4 mr-4 inline-flex flex-col gap-2">
              {userSettings.interlinearLines.map((line) => {
                const value = word[line.name];
                if (!value) {
                  return null;
                }
                return <Word line={line} word={value} />;
              })}
            </span>
          );
        }),
      )}
    </div>
  );
}

function Word({ line, word }: { word: string; line: InterlinearLine }) {
  const { setInspectedWord, inspectedWord } = useTrainingSession();

  const onClick = useCallback(
    (e: MouseEvent<HTMLSpanElement>) => {
      e.preventDefault();
      setInspectedWord(word);
    },
    [setInspectedWord, word],
  );

  const onDoubleClick = useCallback((e: MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
  }, []);

  return (
    <span
      className={cn(
        "hover:ring-primary/50 clear-both cursor-pointer whitespace-nowrap rounded-md px-[4px] py-[2px] text-center leading-none ring-1 ring-transparent transition-colors duration-200",
        {
          "ring-2 ring-yellow-400 hover:ring-yellow-400":
            inspectedWord === word && line.name === PRIMARY_LINE_NAME,
          "pointer-events-none select-none opacity-80":
            line.name !== PRIMARY_LINE_NAME,
        },
      )}
      style={{
        ...getCSSStyleForInterlinearLine(line),
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {word}
    </span>
  );
}
