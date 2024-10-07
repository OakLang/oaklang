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
  const trainingSessionQuery = await trpc.trainingSessions.getTrainingSession(
    params.trainingSessionId,
  );

  if (trainingSessionQuery.languageCode !== params.practiceLanguage) {
    notFound();
  }

  void trpc.trainingSessions.getTrainingSession.prefetch(
    params.trainingSessionId,
  );

  return <HydrateClient>{children}</HydrateClient>;
}
