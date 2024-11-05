"use client";

import type { Sentence } from "@acme/db/schema";

import { useAppStore } from "~/store/app-store";
import InterlinearLineSentence from "./InterlinearLineSentence";

export default function InterlinearView({
  sentences,
}: {
  sentences: Sentence[];
}) {
  const fontSize = useAppStore((state) => state.fontSize);

  return (
    <div
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
