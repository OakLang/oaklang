"use client";

import { useTrainingSession } from "~/providers/TrainingSessionProvider";
import WordsList from "./WordsList";

export default function PracticeWordsPopoverContent() {
  const { practiceWords, setPracticeWords } = useTrainingSession();
  return (
    <WordsList
      words={practiceWords.map((item) => item.word)}
      onWordsChange={setPracticeWords}
      title="Practice Vocabs"
    />
  );
}
