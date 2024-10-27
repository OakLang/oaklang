import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Exercises } from "@acme/core/constants";
import { and, count, desc, eq } from "@acme/db";
import {
  languagesTable,
  practiceLanguagesTable,
  trainingSessionsTable,
  userWordsTable,
} from "@acme/db/schema";
import { createTrainingSessionSchema } from "@acme/db/validators";
import { generateSentencesForExercise1 } from "@acme/wakaq/tasks/generateSentencesForExercise1";
import { generateSentencesForExercise2 } from "@acme/wakaq/tasks/generateSentencesForExercise2";
import { generateSentencesForExercise3 } from "@acme/wakaq/tasks/generateSentencesForExercise3";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getLanguageOrThrow, getTrainingSessionOrThrow } from "../utils";

export const trainingSessionsRouter = createTRPCRouter({
  getTrainingSession: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.string(),
      }),
    )
    .query(async ({ ctx: { db, session }, input }) => {
      const trainingSession = await getTrainingSessionOrThrow(
        input.trainingSessionId,
        db,
        session,
      );
      const language = await getLanguageOrThrow(
        trainingSession.languageCode,
        db,
      );
      return { ...trainingSession, language };
    }),
  getTrainingSessions: protectedProcedure
    .input(
      z.object({
        languageCode: z.string(),
        limit: z.number().optional().default(10),
        cursor: z.number().optional().default(0),
      }),
    )
    .query(async ({ ctx: { db, session }, input }) => {
      const trainingSessionList = await db
        .select()
        .from(trainingSessionsTable)
        .innerJoin(
          languagesTable,
          eq(languagesTable.code, trainingSessionsTable.languageCode),
        )
        .where(
          and(
            eq(trainingSessionsTable.userId, session.user.id),
            eq(trainingSessionsTable.languageCode, input.languageCode),
          ),
        )
        .limit(input.limit)
        .offset(input.cursor)
        .orderBy(desc(trainingSessionsTable.createdAt));

      const list = await Promise.all(
        trainingSessionList
          .map((ts) => ({ ...ts.training_session, language: ts.language }))
          .map(async (ts) => {
            const [newWords] = await db
              .select({ count: count() })
              .from(userWordsTable)
              .where(eq(userWordsTable.createdFromId, ts.id));
            const [knownWords] = await db
              .select({ count: count() })
              .from(userWordsTable)
              .where(eq(userWordsTable.knownFromId, ts.id));

            return {
              ...ts,
              newWordsCount: newWords?.count ?? 0,
              knownWordsCount: knownWords?.count ?? 0,
            };
          }),
      );

      return {
        list,
        nextCursor:
          list.length === input.limit ? input.cursor + input.limit : null,
      };
    }),
  createTrainingSession: protectedProcedure
    .input(createTrainingSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const [language] = await ctx.db
        .select({
          code: practiceLanguagesTable.languageCode,
          name: languagesTable.name,
        })
        .from(practiceLanguagesTable)
        .innerJoin(
          languagesTable,
          eq(languagesTable.code, practiceLanguagesTable.languageCode),
        )
        .where(
          and(
            eq(practiceLanguagesTable.languageCode, input.languageCode),
            eq(practiceLanguagesTable.userId, ctx.session.user.id),
          ),
        );
      if (!language) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Practice language not found!",
        });
      }

      const [trainingSession] = await ctx.db
        .insert(trainingSessionsTable)
        .values({
          title: input.title,
          userId: ctx.session.user.id,
          languageCode: language.code,
          exercise: input.exercise,
          data: input.data,
        })
        .returning();

      if (!trainingSession) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create training session",
        });
      }

      switch (trainingSession.exercise) {
        case Exercises.exercise1:
          await generateSentencesForExercise1.enqueue({
            trainingSessionId: trainingSession.id,
          });
          break;
        case Exercises.exercise2:
          await generateSentencesForExercise2.enqueue({
            trainingSessionId: trainingSession.id,
          });
          break;
        case Exercises.exercise3:
          await generateSentencesForExercise3.enqueue({
            trainingSessionId: trainingSession.id,
          });
          break;
      }

      return trainingSession;
    }),
  changeSentenceIndex: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.string(),
        sentenceIndex: z.number().min(0),
      }),
    )
    .mutation(
      async ({
        ctx: { db, session },
        input: { sentenceIndex, trainingSessionId },
      }) => {
        const trainingSession = await getTrainingSessionOrThrow(
          trainingSessionId,
          db,
          session,
        );

        const [updatedTrainingSession] = await db
          .update(trainingSessionsTable)
          .set({
            sentenceIndex,
          })
          .where(eq(trainingSessionsTable.id, trainingSession.id))
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
          .delete(trainingSessionsTable)
          .where(eq(trainingSessionsTable.id, trainingSession.id))
          .returning();
        if (!deletedTrainingSession) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
        return deletedTrainingSession;
      },
    ),
  generateNextSetOfSentences: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const trainingSession = await getTrainingSessionOrThrow(
        input.trainingSessionId,
        ctx.db,
        ctx.session,
      );

      if (trainingSession.exercise === Exercises.exercise1) {
        await ctx.db
          .update(trainingSessionsTable)
          .set({
            status: "idle",
          })
          .where(eq(trainingSessionsTable.id, trainingSession.id));
        await generateSentencesForExercise1.enqueue({
          trainingSessionId: trainingSession.id,
        });
      }
    }),
});
