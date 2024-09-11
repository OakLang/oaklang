import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { alias, desc, eq } from "@acme/db";
import {
  createTrainingSessionInput,
  languages,
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
      const helpLanguage = alias(languages, "help_language");
      const practiceLanguage = alias(languages, "practice_language");

      const trainingSessionList = await db
        .select({
          id: trainingSessions.id,
          createdAt: trainingSessions.createdAt,
          userId: trainingSessions.userId,
          title: trainingSessions.title,
          sentenceIndex: trainingSessions.sentenceIndex,
          sentenceCount: trainingSessions.sentencesCount,
          complexity: trainingSessions.complexity,
          helpLanguage: trainingSessions.helpLanguage,
          practiceLanguage: trainingSessions.practiceLanguage,
          helpLanguageName: helpLanguage.name,
          practiceLanguageName: practiceLanguage.name,
        })
        .from(trainingSessions)
        .innerJoin(
          helpLanguage,
          eq(trainingSessions.helpLanguage, helpLanguage.code),
        )
        .innerJoin(
          practiceLanguage,
          eq(trainingSessions.practiceLanguage, practiceLanguage.code),
        )
        .where(eq(trainingSessions.userId, session.user.id))
        .orderBy(desc(trainingSessions.id));
      return trainingSessionList;
    },
  ),
  createTrainingSession: protectedProcedure
    .input(createTrainingSessionInput)
    .mutation(async (opts) => {
      const [practiceLanguage] = await opts.ctx.db
        .select()
        .from(languages)
        .where(eq(languages.code, opts.input.practiceLanguage));

      if (!practiceLanguage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Practice language not found!",
        });
      }

      const [helpLanguage] = await opts.ctx.db
        .select()
        .from(languages)
        .where(eq(languages.code, opts.input.helpLanguage));
      if (!helpLanguage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Help language not found!",
        });
      }

      const [trainingSession] = await opts.ctx.db
        .insert(trainingSessions)
        .values({
          practiceLanguage: practiceLanguage.code,
          helpLanguage: helpLanguage.code,
          complexity: opts.input.complexity,
          title: opts.input.title ?? `Learn ${practiceLanguage.name}`,
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
