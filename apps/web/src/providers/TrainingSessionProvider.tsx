"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext } from "react";
import { toast } from "sonner";

import type { TrainingSession, UpdateTrainingSession } from "@acme/db/schema";

import { api } from "~/trpc/react";

export interface TrainingSessionContextValue {
  trainingSession: TrainingSession;
  updateTrainingSession: (_: UpdateTrainingSession) => void;
  changeSentenceIndex: (index: number) => void;
  practiceWords: string[];
  knownWords: string[];
  setKnownWords: (words: string[]) => void;
  setPracticeWords: (words: string[]) => void;
}

export const TrainingSessionContext =
  createContext<TrainingSessionContextValue | null>(null);

export interface TrainingSessionProviderProps {
  children: ReactNode;
  trainingSession: TrainingSession;
}

export default function TrainingSessionProvider(
  props: TrainingSessionProviderProps,
) {
  const utils = api.useUtils();
  const trainingSessionQuery = api.trainingSessions.getTrainingSession.useQuery(
    { trainingSessionId: props.trainingSession.id },
    { initialData: props.trainingSession },
  );

  const practiceWordsQuery = api.words.getWords.useQuery({
    trainingSessionId: props.trainingSession.id,
  });
  const knownWordsQuery = api.words.getKnownWords.useQuery({
    trainingSessionId: props.trainingSession.id,
  });
  const createWordsMut = api.words.createWords.useMutation({
    onSettled: (_, __, { trainingSessionId }) => {
      void utils.words.getWords.invalidate({ trainingSessionId });
      void utils.words.getKnownWords.invalidate({ trainingSessionId });
    },
    onError: (error) => {
      toast("Error", { description: error.message });
    },
  });
  const updateWordsMut = api.words.updateWords.useMutation({
    onSettled: (_, __, { trainingSessionId }) => {
      void utils.words.getWords.invalidate({ trainingSessionId });
      void utils.words.getKnownWords.invalidate({ trainingSessionId });
    },
    onError: (error) => {
      toast("Error", { description: error.message });
    },
  });
  const deleteWordsMut = api.words.deleteWords.useMutation({
    onSettled: (_, __, { trainingSessionId }) => {
      void utils.words.getWords.invalidate({ trainingSessionId });
      void utils.words.getKnownWords.invalidate({ trainingSessionId });
    },
    onError: (error) => {
      toast("Error", { description: error.message });
    },
  });

  const updateTrainingSessionMut =
    api.trainingSessions.updateTrainingSession.useMutation({
      onSuccess: (newTrainingSession) => {
        utils.trainingSessions.getTrainingSession.setData(
          { trainingSessionId: newTrainingSession.id },
          newTrainingSession,
        );
        void utils.trainingSessions.getTrainingSession.invalidate();
      },
    });

  const changeSentenceIndex: TrainingSessionContextValue["changeSentenceIndex"] =
    useCallback(
      (index) => {
        updateTrainingSessionMut.mutate({
          trainingSessionId: trainingSessionQuery.data.id,
          data: {
            sentenceIndex: index,
          },
        });
        utils.trainingSessions.getTrainingSession.setData(
          { trainingSessionId: trainingSessionQuery.data.id },
          (trainingSession) => ({
            ...(trainingSession ?? trainingSessionQuery.data),
            sentenceIndex: index,
          }),
        );
      },
      [
        trainingSessionQuery.data,
        updateTrainingSessionMut,
        utils.trainingSessions.getTrainingSession,
      ],
    );

  const setKnownWords: TrainingSessionContextValue["setKnownWords"] =
    useCallback(
      (newWordsList) => {
        const existingWords = (knownWordsQuery.data ?? []).map((w) => w.word);
        const newWords = newWordsList.filter((w) => !existingWords.includes(w));
        const deletedWords = existingWords.filter(
          (w) => !newWordsList.includes(w),
        );
        console.log({ newWords, deletedWords });
        if (newWords.length) {
          createWordsMut.mutate({
            words: newWords,
            trainingSessionId: trainingSessionQuery.data.id,
            isKnown: true,
          });
        }
        if (deletedWords.length) {
          updateWordsMut.mutate({
            trainingSessionId: trainingSessionQuery.data.id,
            words: deletedWords,
            data: { isKnown: false },
          });
        }
        utils.words.getKnownWords.setData(
          { trainingSessionId: trainingSessionQuery.data.id },
          (words) => [
            ...(words ?? []).filter((w) => !deletedWords.includes(w.word)),
            ...newWords.map((word) => ({
              word,
              trainingSessionId: trainingSessionQuery.data.id,
              isKnown: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          ],
        );
      },
      [
        createWordsMut,
        knownWordsQuery.data,
        trainingSessionQuery.data.id,
        updateWordsMut,
        utils.words.getKnownWords,
      ],
    );

  const setPracticeWords: TrainingSessionContextValue["setPracticeWords"] =
    useCallback(
      (newWordsList) => {
        const existingWords = (practiceWordsQuery.data ?? []).map(
          (w) => w.word,
        );
        const newWords = newWordsList.filter((w) => !existingWords.includes(w));
        const deletedWords = existingWords.filter(
          (w) => !newWordsList.includes(w),
        );
        if (newWords.length) {
          createWordsMut.mutate({
            words: newWords,
            trainingSessionId: trainingSessionQuery.data.id,
          });
        }
        if (deletedWords.length) {
          deleteWordsMut.mutate({
            trainingSessionId: trainingSessionQuery.data.id,
            words: deletedWords,
          });
        }
        utils.words.getWords.setData(
          { trainingSessionId: trainingSessionQuery.data.id },
          (words) => [
            ...(words ?? []).filter((w) => !deletedWords.includes(w.word)),
            ...newWords.map((word) => ({
              word,
              isKnown: false,
              trainingSessionId: trainingSessionQuery.data.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          ],
        );
      },
      [
        createWordsMut,
        deleteWordsMut,
        practiceWordsQuery.data,
        trainingSessionQuery.data.id,
        utils.words.getWords,
      ],
    );

  const updateTrainingSession = useCallback(
    (data: UpdateTrainingSession) => {
      updateTrainingSessionMut.mutate({
        trainingSessionId: trainingSessionQuery.data.id,
        data,
      });
      utils.trainingSessions.getTrainingSession.setData(
        { trainingSessionId: trainingSessionQuery.data.id },
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (oldData) => ({ ...oldData!, ...data }),
      );
    },
    [
      trainingSessionQuery.data.id,
      updateTrainingSessionMut,
      utils.trainingSessions.getTrainingSession,
    ],
  );

  return (
    <TrainingSessionContext.Provider
      value={{
        trainingSession: trainingSessionQuery.data,
        changeSentenceIndex,
        knownWords: (knownWordsQuery.data ?? []).map((w) => w.word),
        practiceWords: (practiceWordsQuery.data ?? []).map((w) => w.word),
        setKnownWords,
        setPracticeWords,
        updateTrainingSession,
      }}
    >
      {props.children}
    </TrainingSessionContext.Provider>
  );
}

export const useTrainingSession = () => {
  const context = useContext(TrainingSessionContext);
  if (!context) {
    throw new Error(
      "useTrainingSession must use inside TrainingSessionProvider",
    );
  }
  return context;
};
