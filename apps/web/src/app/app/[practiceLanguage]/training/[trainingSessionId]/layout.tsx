import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import type { TrainingSessionParams } from "~/types";
import { HydrateClient, trpc } from "~/trpc/server";

export default async function TrainingLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: TrainingSessionParams;
}>) {
  const trainingSession = await trpc.trainingSessions.getTrainingSession({
    trainingSessionId: params.trainingSessionId,
  });

  if (trainingSession.languageCode !== params.practiceLanguage) {
    notFound();
  }

  void trpc.trainingSessions.getTrainingSession.prefetch(
    { trainingSessionId: params.trainingSessionId },
    { initialData: trainingSession },
  );

  return <HydrateClient>{children}</HydrateClient>;
}
