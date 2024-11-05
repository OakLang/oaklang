import { notFound } from "next/navigation";

import { eq } from "@acme/db";
import { db } from "@acme/db/client";
import { trainingSessionsTable } from "@acme/db/schema";

import type { TrainingSessionParams } from "~/types";
import TrainingSessionView from "~/components/playground/training-session-view";
import TrainingSessionProvider from "~/providers/training-session-provider";
import { HydrateClient, trpc } from "~/trpc/server";

export const dynamic = "force-dynamic";

export default async function TrainingPage(
  props: Readonly<{
    params: Promise<TrainingSessionParams>;
  }>,
) {
  const { params } = props;
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

  return (
    <HydrateClient>
      <TrainingSessionProvider trainingSessionId={trainingSessionId}>
        <div className="flex h-[calc(100vh-4rem-1px)] overflow-hidden">
          <TrainingSessionView />
        </div>
      </TrainingSessionProvider>
    </HydrateClient>
  );
}
