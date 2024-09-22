import type { ReactNode } from "react";
import { createContext, useContext, useRef } from "react";
import { useStore } from "zustand";

import type { TrainingSession } from "@acme/db/schema";

import type { TrainingSessionStore } from "~/store/training-session-store";
import {
  createTrainingSessionStore,
  initTrainingSessionStore,
} from "~/store/training-session-store";

export type TrainingSessionStoreApi = ReturnType<
  typeof createTrainingSessionStore
>;

export const TrainingSessionStoreContext = createContext<
  TrainingSessionStoreApi | undefined
>(undefined);

export interface TrainingSessionStoreProviderProps {
  children: ReactNode;
  trainingSession: TrainingSession;
}

export default function TrainingSessionStoreProvider({
  children,
  trainingSession,
}: TrainingSessionStoreProviderProps) {
  const storeRef = useRef<TrainingSessionStoreApi>();
  if (!storeRef.current) {
    storeRef.current = createTrainingSessionStore(
      initTrainingSessionStore({ trainingSession }),
    );
  }

  return (
    <TrainingSessionStoreContext.Provider value={storeRef.current}>
      {children}
    </TrainingSessionStoreContext.Provider>
  );
}

export function useTrainingSessionStore<T>(
  selector: (store: TrainingSessionStore) => T,
): T {
  const context = useContext(TrainingSessionStoreContext);

  if (!context) {
    throw new Error(
      `useTrainingSessionStore must be used within TrainingSessionStoreProvider`,
    );
  }

  return useStore(context, selector);
}
