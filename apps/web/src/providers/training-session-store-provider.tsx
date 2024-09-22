import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useStore } from "zustand";

import type {
  TrainingSession,
  UpdateTrainingSessionInput,
} from "@acme/db/schema";

import type { TrainingSessionStore } from "~/store/training-session-store";
import {
  createTrainingSessionStore,
  initTrainingSessionStore,
} from "~/store/training-session-store";
import { api } from "~/trpc/react";

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

  const updateTrainingSessionMut =
    api.trainingSessions.updateTrainingSession.useMutation({
      onMutate: () => {
        return { trainingSession };
      },
      onError: (error, _, ctx) => {
        toast("Faield to change sentence Index", {
          description: error.message,
        });
        if (ctx) {
          storeRef.current?.setState((state) => ({
            ...state,
            trainingSession: ctx.trainingSession,
          }));
        }
      },
    });

  useEffect(() => {
    if (!storeRef.current) {
      return;
    }

    const unsub = storeRef.current.subscribe((state, prevState) => {
      let updateData: UpdateTrainingSessionInput = {};

      if (
        state.trainingSession.sentenceIndex !==
        prevState.trainingSession.sentenceIndex
      ) {
        updateData = {
          ...updateData,
          sentenceIndex: state.trainingSession.sentenceIndex,
        };
      }

      if (state.trainingSession.title !== prevState.trainingSession.title) {
        updateData = {
          ...updateData,
          title: state.trainingSession.title,
        };
      }

      if (
        state.trainingSession.complexity !==
        prevState.trainingSession.complexity
      ) {
        updateData = {
          ...updateData,
          complexity: state.trainingSession.complexity,
        };
      }

      if (Object.keys(updateData).length !== 0) {
        updateTrainingSessionMut.mutate({
          trainingSessionId: state.trainingSession.id,
          data: updateData,
        });
      }
    });

    return () => {
      unsub();
    };
  }, [updateTrainingSessionMut]);

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
