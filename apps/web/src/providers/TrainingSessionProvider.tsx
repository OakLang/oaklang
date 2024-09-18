"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { TrainingSession, UpdateTrainingSession } from "@acme/db/schema";

import { api } from "~/trpc/react";

export interface TrainingSessionContextValue {
  trainingSession: TrainingSession;
  updateTrainingSession: (_: UpdateTrainingSession) => void;
  sentenceIndex: number;
  changeSentenceIndex: (index: number) => void;
  inspectedWord: string | null;
  setInspectedWord: (value: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
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
  const [inspectedWord, setInspectedWord] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleSidebarOpenChange = useCallback((open: boolean) => {
    setSidebarOpen(open);
    if (open) {
      localStorage.setItem("inspection_sidebar_open", "true");
    } else {
      localStorage.removeItem("inspection_sidebar_open");
    }
  }, []);

  useEffect(() => {
    setSidebarOpen(localStorage.getItem("inspection_sidebar_open") === "true");
  }, []);

  return (
    <TrainingSessionContext.Provider
      value={{
        trainingSession: trainingSessionQuery.data,
        sentenceIndex,
        changeSentenceIndex,
        updateTrainingSession,
        inspectedWord,
        setInspectedWord,
        sidebarOpen,
        setSidebarOpen: handleSidebarOpenChange,
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
