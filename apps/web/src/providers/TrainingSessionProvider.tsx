"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useState } from "react";

import type { TrainingSession, UpdateTrainingSession } from "@acme/db/schema";

import { api } from "~/trpc/react";

export interface TrainingSessionContextValue {
  trainingSession: TrainingSession;
  updateTrainingSession: (_: UpdateTrainingSession) => void;
  sentenceIndex: number;
  changeSentenceIndex: (index: number) => void;
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
  const [sentenceIndex, setSentenceIndex] = useState(
    trainingSessionQuery.data.sentenceIndex,
  );

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
        setSentenceIndex(index);
        updateTrainingSessionMut.mutate({
          trainingSessionId: trainingSessionQuery.data.id,
          data: {
            sentenceIndex: index,
          },
        });
      },
      [trainingSessionQuery.data, updateTrainingSessionMut],
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
        sentenceIndex,
        changeSentenceIndex,
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
