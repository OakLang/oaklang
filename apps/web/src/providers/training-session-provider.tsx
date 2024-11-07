"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { Language, TrainingSession } from "@acme/db/schema";

import RenderQueryResult from "~/components/RenderQueryResult";
import { api } from "~/trpc/react";
import { usePracticeLanguage } from "./practice-language-provider";

export interface TrainingSessionContextValue {
  trainingSession: TrainingSession & { language: Language };
  updateTrainingSession: ReturnType<
    typeof api.trainingSessions.updateTrainingSession.useMutation
  >;
}

export const TrainingSessionContext =
  createContext<TrainingSessionContextValue | null>(null);

export interface TrainingSessionProviderProps {
  children: ReactNode;
  trainingSessionId: string;
}

export default function TrainingSessionProvider({
  children,
  trainingSessionId,
}: TrainingSessionProviderProps) {
  const { language } = usePracticeLanguage();
  const trainingSessionQuery = api.trainingSessions.getTrainingSession.useQuery(
    { trainingSessionId },
  );

  const utils = api.useUtils();
  const updateTrainingSession =
    api.trainingSessions.updateTrainingSession.useMutation({
      onMutate: (vars) => {
        const oldData = utils.trainingSessions.getTrainingSession.getData({
          trainingSessionId: vars.trainingSessionId,
        });
        if (oldData) {
          utils.trainingSessions.getTrainingSession.setData(
            { trainingSessionId: vars.trainingSessionId },
            () => ({
              ...oldData,
              ...vars.dto,
            }),
          );
        }
        return { oldData };
      },
      onError: (error, vars, ctx) => {
        toast("Failed to update training session", {
          description: error.message,
        });
        if (ctx?.oldData) {
          utils.trainingSessions.getTrainingSession.setData(
            { trainingSessionId: vars.trainingSessionId },
            ctx.oldData,
          );
        } else {
          void utils.trainingSessions.getTrainingSession.invalidate({
            trainingSessionId: vars.trainingSessionId,
          });
        }
      },
    });

  return (
    <RenderQueryResult
      query={trainingSessionQuery}
      renderLoading={() => (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      )}
    >
      {(query) => {
        if (query.data.languageCode !== language.code) {
          return <p>Not found!</p>;
        }

        return (
          <TrainingSessionContext
            value={{
              trainingSession: query.data,
              updateTrainingSession,
            }}
          >
            {children}
          </TrainingSessionContext>
        );
      }}
    </RenderQueryResult>
  );
}

export function useTrainingSession() {
  const context = useContext(TrainingSessionContext);
  if (!context) {
    throw new Error(
      "useTrainingSession must use inside TrainingSessionProvider",
    );
  }
  return context;
}
