"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext } from "react";

import type { TrainingSession } from "@acme/db/schema";

import { api } from "~/trpc/react";

export interface TrainingSessionContextValue {
  trainingSession: TrainingSession;
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
    {
      trainingSessionId: props.trainingSession.id,
    },
    {
      initialData: props.trainingSession,
    },
  );
  const updateTrainingSession =
    api.trainingSessions.updateTrainingSession.useMutation();

  const changeSentenceIndex: TrainingSessionContextValue["changeSentenceIndex"] =
    useCallback(
      (index) => {
        updateTrainingSession.mutate({
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
        updateTrainingSession,
        utils.trainingSessions.getTrainingSession,
      ],
    );

  return (
    <TrainingSessionContext.Provider
      value={{
        trainingSession: trainingSessionQuery.data,
        changeSentenceIndex,
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
