"use client";

import type { MouseEvent } from "react";
import { useRef } from "react";

import type { Sentence } from "@acme/db/schema";

import { useAppStore } from "~/store/app-store";
import InterlinearLineSentence from "./InterlinearLineSentence";

export default function InterlinearView({
  sentences,
}: {
  sentences: Sentence[];
}) {
  const setInspectedWord = useAppStore((state) => state.setInspectedWord);
  const fontSize = useAppStore((state) => state.fontSize);

  const ref = useRef<HTMLDivElement>(null);

  const onBodyClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === ref.current) {
      setInspectedWord(null);
    }
  };

  return (
    <div
      ref={ref}
      onClick={onBodyClick}
      className="pointer-events-none grid"
      style={{
        rowGap: `${(4 * fontSize) / 16}rem`,
      }}
    >
      {sentences.map((sentence) => (
        <InterlinearLineSentence key={sentence.id} sentence={sentence} />
      ))}
    </div>
  );
}
