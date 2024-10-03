import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { HydrateClient, trpc } from "~/trpc/server";

export default async function TrainingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { trainingSessionId: string; practiceLanguage: string };
}) {
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
