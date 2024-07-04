"use client";

import { useTrainingSession } from "~/providers/TrainingSessionProvider";
import WordsList from "./WordsList";

export default function KnownWordsPopoverContent() {
  const { knownWords, setKnownWords } = useTrainingSession();

  return (
    <WordsList
      words={knownWords.map((item) => item.word)}
      onWordsChange={setKnownWords}
      title="Known Vocabs"
    />
  );
}
