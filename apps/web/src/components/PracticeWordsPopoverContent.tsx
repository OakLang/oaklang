"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import WordsList from "./WordsList";

export default function PracticeWordsPopoverContent({
  trainingSessionId,
}: {
  trainingSessionId: string;
}) {
  const utils = api.useUtils();
  const wordsQuery = api.words.getWords.useQuery({
    trainingSessionId,
  });
  const createWordsMut = api.words.createWords.useMutation({
    onSettled: (_, __, { trainingSessionId }) => {
      void utils.words.getWords.refetch({ trainingSessionId });
      void utils.words.getKnownWords.invalidate({ trainingSessionId });
    },
    onError: (error) => {
      toast("Error", { description: error.message });
    },
  });
  const deleteWordsMut = api.words.deleteWords.useMutation({
    onSettled: (_, __, { trainingSessionId }) => {
      void utils.words.getWords.refetch({ trainingSessionId });
      void utils.words.getKnownWords.invalidate({ trainingSessionId });
    },
    onError: (error) => {
      toast("Error", { description: error.message });
    },
  });

  const handleOnWordsChange = useCallback(
    (newWordsList: string[]) => {
      const existingWords = (wordsQuery.data ?? []).map((w) => w.word);
      const newWords = newWordsList.filter((w) => !existingWords.includes(w));
      const deletedWords = existingWords.filter(
        (w) => !newWordsList.includes(w),
      );
      if (newWords.length) {
        createWordsMut.mutate({
          words: newWords,
          trainingSessionId,
        });
      }
      if (deletedWords.length) {
        deleteWordsMut.mutate({
          trainingSessionId,
          words: deletedWords,
        });
      }
      utils.words.getWords.setData({ trainingSessionId }, (words) => [
        ...(words ?? []).filter((w) => !deletedWords.includes(w.word)),
        ...newWords.map((word) => ({
          word,
          isKnown: false,
          trainingSessionId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      ]);
    },
    [
      wordsQuery.data,
      createWordsMut,
      trainingSessionId,
      deleteWordsMut,
      utils.words.getWords,
    ],
  );

  if (wordsQuery.isPending) {
    return <p>Loading...</p>;
  }

  if (wordsQuery.isError) {
    return <p>{wordsQuery.error.message}</p>;
  }

  return (
    <WordsList
      words={wordsQuery.data.map((word) => word.word)}
      onWordsChange={handleOnWordsChange}
      title="Practice Vocabs"
    />
  );
}
