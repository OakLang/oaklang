import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { eq } from "@acme/db";
import {
  createTrainingSessionInput,
  trainingSessions,
  updateTrainingSessionInput,
} from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getTrainingSessionOrThrow } from "../utils";

export const trainingSessionsRouter = createTRPCRouter({
  getTrainingSession: protectedProcedure
    .input(z.object({ trainingSessionId: z.string() }))
    .query(async ({ ctx: { db, session }, input: { trainingSessionId } }) => {
      const trainingSession = await getTrainingSessionOrThrow(
        trainingSessionId,
        db,
        session,
      );
      return trainingSession;
    }),
  getTrainingSessions: protectedProcedure.query(
    async ({ ctx: { db, session } }) => {
      const trainingSessionList = await db
        .select()
        .from(trainingSessions)
        .where(eq(trainingSessions.userId, session.user.id));
      return trainingSessionList;
    },
  ),
  createTrainingSession: protectedProcedure
    .input(createTrainingSessionInput)
    .mutation(async (opts) => {
      const [trainingSession] = await opts.ctx.db
        .insert(trainingSessions)
        .values({
          ...opts.input,
          userId: opts.ctx.session.user.id,
        })
        .returning();

      if (!trainingSession) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create training session",
        });
      }

      return trainingSession;
    }),
  updateTrainingSession: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.string(),
        data: updateTrainingSessionInput,
      }),
    )
    .mutation(
      async ({ ctx: { db, session }, input: { data, trainingSessionId } }) => {
        const trainingSession = await getTrainingSessionOrThrow(
          trainingSessionId,
          db,
          session,
        );
        const [updatedTrainingSession] = await db
          .update(trainingSessions)
          .set(data)
          .where(eq(trainingSessions.id, trainingSession.id))
          .returning();
        if (!updatedTrainingSession) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
        return updatedTrainingSession;
      },
    ),
  deleteTrainingSession: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.string(),
      }),
    )
    .mutation(
      async ({ ctx: { db, session }, input: { trainingSessionId } }) => {
        const trainingSession = await getTrainingSessionOrThrow(
          trainingSessionId,
          db,
          session,
        );
        const [deletedTrainingSession] = await db
          .delete(trainingSessions)
          .where(eq(trainingSessions.id, trainingSession.id))
          .returning();
        if (!deletedTrainingSession) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
        return deletedTrainingSession;
      },
    ),
});
