"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";

import type { SentenceWord } from "@acme/db/schema";

import type { RouterOutputs } from "~/trpc/react";
import ScrollView from "~/components/playground/scroll-view";
import { SentenceView } from "~/components/playground/sentence-view";
import { TrainingSessionCompleteView } from "~/components/playground/training-session-complete-view";
import { useTrainingSession } from "~/providers/training-session-provider";
import { api } from "~/trpc/react";
import RenderQueryResult from "../RenderQueryResult";
import PlaygroundFooter from "./playground-footer";
import PlaygroundSidebar from "./sidebar";

export interface TrainingSessionViewContextValue {
  sentences: RouterOutputs["sentences"]["getSentences"];
  isComplete: boolean;
  setIsComplete: Dispatch<SetStateAction<boolean>>;
  inspectedWord: SentenceWord | null;
  setInspectedWord: Dispatch<SetStateAction<SentenceWord | null>>;
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  closeSession: () => void;
}

const Context = createContext<TrainingSessionViewContextValue | null>(null);

export default function TrainingSessionView({
  onClose,
}: {
  onClose?: () => void;
}) {
  const [inspectedWord, setInspectedWord] = useState<SentenceWord | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { trainingSession, updateTrainingSession } = useTrainingSession();
  const router = useRouter();

  const sentencesQuery = api.sentences.getSentences.useQuery(
    { trainingSessionId: trainingSession.id },
    { placeholderData: keepPreviousData },
  );

  const utils = api.useUtils();

  const closeSession = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.push(`/app/${trainingSession.languageCode}`);
    }
  }, [onClose, router, trainingSession.languageCode]);

  useEffect(() => {
    if (trainingSession.status === "success") {
      void utils.sentences.getSentences.invalidate({
        trainingSessionId: trainingSession.id,
      });
    }
  }, [
    trainingSession.id,
    trainingSession.status,
    utils.sentences.getSentences,
  ]);

  useEffect(() => {
    if (updateTrainingSession.isPending) {
      return;
    }

    let timeout: NodeJS.Timeout | null = null;
    if (
      trainingSession.status === "idle" ||
      trainingSession.status === "pending"
    ) {
      timeout = setInterval(() => {
        void utils.trainingSessions.getTrainingSession.invalidate({
          trainingSessionId: trainingSession.id,
        });
      }, 1000);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [
    trainingSession.id,
    trainingSession.status,
    updateTrainingSession.isPending,
    utils.trainingSessions.getTrainingSession,
  ]);

  return (
    <RenderQueryResult
      query={sentencesQuery}
      renderError={(query) => (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground text-center">
              Setences Error: {query.error.message}
            </p>
          </div>
        </div>
      )}
      renderLoading={() => (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2Icon className="h-6 w-6 animate-spin" />
            <p className="text-muted-foreground text-center">
              Loading Sentences...
            </p>
          </div>
        </div>
      )}
    >
      {(query) => {
        return (
          <Context.Provider
            value={{
              sentences: query.data,
              isComplete,
              setIsComplete,
              inspectedWord,
              setInspectedWord,
              setSidebarOpen,
              sidebarOpen,
              closeSession,
            }}
          >
            {isComplete ? (
              <TrainingSessionCompleteView />
            ) : (
              <div className="flex flex-1 overflow-hidden">
                <div className="flex flex-1 flex-col overflow-hidden">
                  <div className="flex flex-1 flex-col overflow-hidden">
                    {trainingSession.view === "sentence" ? (
                      <SentenceView />
                    ) : trainingSession.view === "scroll" ? (
                      <ScrollView />
                    ) : (
                      <p>Unsupported View</p>
                    )}
                  </div>
                  <PlaygroundFooter />
                </div>
                <PlaygroundSidebar />
              </div>
            )}
          </Context.Provider>
        );
      }}
    </RenderQueryResult>
  );
}

export function useTrainingSessionView() {
  const context = useContext(Context);
  if (!context) {
    throw new Error(
      "useTrainingSessionView must use inside TrainingSessionView",
    );
  }
  return context;
}
