"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { TrainingSession } from "@acme/db/schema";

import { api } from "~/trpc/react";

export interface TrainingSessionContextValue {
  trainingSession: TrainingSession;
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
  const trainingSessionQuery = api.trainingSessions.getTrainingSession.useQuery(
    {
      trainingSessionId: props.trainingSession.id,
    },
    {
      initialData: props.trainingSession,
    },
  );

  return (
    <TrainingSessionContext.Provider
      value={{ trainingSession: trainingSessionQuery.data }}
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
