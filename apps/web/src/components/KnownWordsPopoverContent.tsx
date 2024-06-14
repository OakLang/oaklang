"use client";

import { useTrainingSession } from "~/providers/TrainingSessionProvider";
import WordsList from "./WordsList";

export default function KnownWordsPopoverContent() {
  const { knownWords, setKnownWords } = useTrainingSession();

  return (
    <WordsList
      words={knownWords}
      onWordsChange={setKnownWords}
      title="Known Vocabs"
    />
  );
}
