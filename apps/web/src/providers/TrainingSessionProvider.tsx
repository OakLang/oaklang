"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { TrainingSession } from "@acme/db/schema";

import { api } from "~/trpc/react";

export type TrainingSessionContextValue =
  | {
      status: "pending";
      error: null;
      trainingSession: null;
    }
  | {
      status: "error";
      error: string;
      trainingSession: null;
    }
  | {
      status: "success";
      error: null;
      trainingSession: TrainingSession;
    };

export const TrainingSessionContext =
  createContext<TrainingSessionContextValue | null>(null);

export interface TrainingSessionProviderProps {
  trainingSessionId: string;
  children: ReactNode;
  trainingSession?: TrainingSession;
}

export default function TrainingSessionProvider(
  props: TrainingSessionProviderProps,
) {
  const trainingSessionQuery = api.trainingSessions.getTrainingSession.useQuery(
    {
      trainingSessionId: props.trainingSessionId,
    },
    {
      initialData: props.trainingSession,
    },
  );

  return (
    <TrainingSessionContext.Provider
      value={
        trainingSessionQuery.isPending
          ? { status: "pending", error: null, trainingSession: null }
          : trainingSessionQuery.isError
            ? {
                status: "error",
                error: trainingSessionQuery.error.message,
                trainingSession: null,
              }
            : {
                status: "success",
                error: null,
                trainingSession: trainingSessionQuery.data,
              }
      }
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
