import type { ReactNode } from "react";

import TrainingSessionProvider from "~/providers/TrainingSessionProvider";
import { api } from "~/trpc/server";

export default async function TrainingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { trainingSessionId: string };
}) {
  const trainingSession = await api.trainingSessions.getTrainingSession({
    trainingSessionId: params.trainingSessionId,
  });

  return (
    <TrainingSessionProvider trainingSession={trainingSession}>
      {children}
    </TrainingSessionProvider>
  );
}
