import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, desc, eq } from "@acme/db";
import {
  createTrainingSessionInput,
  languages,
  practiceLanguages,
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
  getTrainingSessions: protectedProcedure
    .input(
      z.object({
        languageCode: z.string(),
      }),
    )
    .query(async ({ ctx: { db, session }, input }) => {
      const trainingSessionList = await db
        .select({
          id: trainingSessions.id,
          createdAt: trainingSessions.createdAt,
          userId: trainingSessions.userId,
          title: trainingSessions.title,
          sentenceIndex: trainingSessions.sentenceIndex,
          complexity: trainingSessions.complexity,
          languageCode: trainingSessions.languageCode,
          languageName: languages.name,
        })
        .from(trainingSessions)
        .innerJoin(languages, eq(languages.code, trainingSessions.languageCode))
        .where(
          and(
            eq(trainingSessions.userId, session.user.id),
            eq(trainingSessions.languageCode, input.languageCode),
          ),
        )
        .orderBy(desc(trainingSessions.id));
      return trainingSessionList;
    }),
  createTrainingSession: protectedProcedure
    .input(createTrainingSessionInput)
    .mutation(async (opts) => {
      const [language] = await opts.ctx.db
        .select({
          code: practiceLanguages.languageCode,
          name: languages.name,
        })
        .from(practiceLanguages)
        .innerJoin(
          languages,
          eq(languages.code, practiceLanguages.languageCode),
        )
        .where(
          and(
            eq(practiceLanguages.languageCode, opts.input.languageCode),
            eq(practiceLanguages.userId, opts.ctx.session.user.id),
          ),
        );
      if (!language) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Practice language not found!",
        });
      }

      const [trainingSession] = await opts.ctx.db
        .insert(trainingSessions)
        .values({
          languageCode: language.code,
          complexity: opts.input.complexity,
          title: opts.input.title ?? `Learn ${language.name}`,
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
