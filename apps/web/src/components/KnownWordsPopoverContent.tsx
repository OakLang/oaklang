"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import WordsList from "./WordsList";

export default function KnownWordsPopoverContent({
  trainingSessionId,
}: {
  trainingSessionId: string;
}) {
  const utils = api.useUtils();
  const knownWordsQuery = api.words.getKnownWords.useQuery({
    trainingSessionId,
  });
  const createWordsMut = api.words.createWords.useMutation({
    onSettled: (_, __, { trainingSessionId }) => {
      void utils.words.getWords.invalidate({ trainingSessionId });
      void utils.words.getKnownWords.refetch({ trainingSessionId });
    },
    onError: (error) => {
      toast("Error", { description: error.message });
    },
  });
  const updateWordsMut = api.words.updateWords.useMutation({
    onSettled: (_, __, { trainingSessionId }) => {
      void utils.words.getWords.invalidate({ trainingSessionId });
      void utils.words.getKnownWords.refetch({ trainingSessionId });
    },
    onError: (error) => {
      toast("Error", { description: error.message });
    },
  });

  const handleOnWordsChange = useCallback(
    (newWordsList: string[]) => {
      const existingWords = (knownWordsQuery.data ?? []).map((w) => w.word);
      const newWords = newWordsList.filter((w) => !existingWords.includes(w));
      const deletedWords = existingWords.filter(
        (w) => !newWordsList.includes(w),
      );
      console.log({ newWords, deletedWords });
      if (newWords.length) {
        createWordsMut.mutate({
          words: newWords,
          trainingSessionId,
          isKnown: true,
        });
      }
      if (deletedWords.length) {
        updateWordsMut.mutate({
          trainingSessionId,
          words: deletedWords,
          data: { isKnown: false },
        });
      }
      utils.words.getKnownWords.setData({ trainingSessionId }, (words) => [
        ...(words ?? []).filter((w) => !deletedWords.includes(w.word)),
        ...newWords.map((word) => ({
          word,
          trainingSessionId,
          isKnown: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      ]);
    },
    [
      createWordsMut,
      knownWordsQuery.data,
      trainingSessionId,
      updateWordsMut,
      utils.words.getKnownWords,
    ],
  );

  if (knownWordsQuery.isPending) {
    return <p>Loading...</p>;
  }

  if (knownWordsQuery.isError) {
    return <p>{knownWordsQuery.error.message}</p>;
  }

  return (
    <WordsList
      words={knownWordsQuery.data.map((word) => word.word)}
      onWordsChange={handleOnWordsChange}
      title="Known Vocabs"
    />
  );
}
