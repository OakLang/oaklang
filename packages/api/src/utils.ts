import { TRPCError } from "@trpc/server";

import type { Session } from "@acme/auth";
import type { DB } from "@acme/db/client";
import { eq } from "@acme/db";
import { trainingSessions } from "@acme/db/schema";

export const getTrainingSessionOrThrow = async (
  trainingSessionId: string,
  db: DB,
  session: Session,
) => {
  const [trainingSession] = await db
    .select()
    .from(trainingSessions)
    .where(eq(trainingSessions.id, trainingSessionId));
  if (!trainingSession || trainingSession.userId !== session.user.id) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Training Session not found!",
    });
  }
  return trainingSession;
};
