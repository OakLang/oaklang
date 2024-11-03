import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { eq } from "@acme/db";
import { db } from "@acme/db/client";
import { trainingSessionsTable } from "@acme/db/schema";

import type { TrainingSessionParams } from "~/types";
import { HydrateClient, trpc } from "~/trpc/server";

export default async function TrainingLayout(
  props: Readonly<{
    children: ReactNode;
    params: Promise<TrainingSessionParams>;
  }>,
) {
  const { children, params } = props;
  const { languageCode, trainingSessionId } = await params;

  const trainingSession = await trpc.trainingSessions.getTrainingSession({
    trainingSessionId,
  });

  if (trainingSession.languageCode !== languageCode) {
    notFound();
  }

  void trpc.trainingSessions.getTrainingSession.prefetch(
    { trainingSessionId },
    { initialData: trainingSession },
  );

  await db
    .update(trainingSessionsTable)
    .set({ lastPracticedAt: new Date() })
    .where(eq(trainingSessionsTable.id, trainingSession.id));

  return <HydrateClient>{children}</HydrateClient>;
}
