import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Exercise } from "@acme/core/constants";
import type { TrainingSession } from "@acme/db/schema";
import { ALL_EXERCISES, Exercises } from "@acme/core/constants";
import { createTrainingSessionSchema } from "@acme/core/validators";
import { and, asc, count, desc, eq, ilike, inArray, or } from "@acme/db";
import {
  languagesTable,
  practiceLanguagesTable,
  trainingSessionsTable,
  trainingSessionView,
  userWordsTable,
  wordsTable,
} from "@acme/db/schema";
import { generateSentencesForExercise1 } from "@acme/wakaq/tasks/generateSentencesForExercise1";
import { generateSentencesForExercise2 } from "@acme/wakaq/tasks/generateSentencesForExercise2";
import { generateSentencesForExercise3 } from "@acme/wakaq/tasks/generateSentencesForExercise3";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getLanguageOrThrow, getTrainingSessionOrThrow } from "../utils";

async function startGeneratingSentences(trainingSession: TrainingSession) {
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
}

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
        search: z.string().nullish(),
        exercises: z.array(z.string()).optional(),
        orderBy: z
          .enum(["createdAt", "title", "lastPracticedAt"])
          .default("createdAt"),
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
            ...(input.exercises && input.exercises.length > 0
              ? [
                  inArray(
                    trainingSessionsTable.exercise,
                    input.exercises as Exercise["id"][],
                  ),
                ]
              : []),
            ...(input.search
              ? [
                  or(
                    eq(trainingSessionsTable.id, input.search),
                    ilike(trainingSessionsTable.title, `%${input.search}%`),
                  ),
                ]
              : []),
          ),
        )
        .limit(input.limit)
        .offset(input.cursor)
        .orderBy(
          input.orderBy === "title"
            ? asc(trainingSessionsTable.title)
            : input.orderBy === "lastPracticedAt"
              ? desc(trainingSessionsTable.lastPracticedAt)
              : desc(trainingSessionsTable.createdAt),
        );

      const list = await Promise.all(
        trainingSessionList.map(async ({ language, training_session }) => {
          const [newWords] = await db
            .select({ count: count() })
            .from(userWordsTable)
            .where(eq(userWordsTable.createdFromId, training_session.id));
          const [knownWords] = await db
            .select({ count: count() })
            .from(userWordsTable)
            .where(eq(userWordsTable.knownFromId, training_session.id));

          return {
            ...training_session,
            language,
            newWordsCount: newWords?.count ?? 0,
            knownWordsCount: knownWords?.count ?? 0,
            exerciseInfo: ALL_EXERCISES.find(
              (exercise) => exercise.id === training_session.exercise,
            ),
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
          exercise: input.exercise.exercise,
          data: input.exercise.data,
        })
        .returning();

      if (!trainingSession) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create training session",
        });
      }

      await startGeneratingSentences(trainingSession);

      return trainingSession;
    }),
  updateTrainingSession: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.string(),
        dto: z
          .object({
            sentenceIndex: z.number().min(0),
            view: z.enum(trainingSessionView.enumValues),
            title: z.string().min(1).max(100),
          })
          .partial(),
      }),
    )
    .mutation(
      async ({ ctx: { db, session }, input: { dto, trainingSessionId } }) => {
        const trainingSession = await getTrainingSessionOrThrow(
          trainingSessionId,
          db,
          session,
        );

        const [updatedTrainingSession] = await db
          .update(trainingSessionsTable)
          .set(dto)
          .where(eq(trainingSessionsTable.id, trainingSession.id))
          .returning();

        if (!updatedTrainingSession) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }

        return updatedTrainingSession;
      },
    ),
  duplicateTrainingSession: protectedProcedure
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

        const { data, exercise, languageCode, title, view } = trainingSession;
        const [newTrainingSession] = await db
          .insert(trainingSessionsTable)
          .values({
            data,
            exercise,
            languageCode,
            title: `${title} - Copy`,
            view,
            userId: session.user.id,
          })
          .returning();

        if (!newTrainingSession) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }

        await startGeneratingSentences(newTrainingSession);

        return newTrainingSession;
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
  getAllKnownWordsFromSession: protectedProcedure
    .input(z.object({ trainingSessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const trainingSession = await getTrainingSessionOrThrow(
        input.trainingSessionId,
        ctx.db,
        ctx.session,
      );

      const knownWords = await ctx.db
        .select({ word: wordsTable })
        .from(userWordsTable)
        .innerJoin(wordsTable, eq(wordsTable.id, userWordsTable.wordId))
        .where(
          and(
            eq(userWordsTable.userId, ctx.session.user.id),
            eq(userWordsTable.knownFromId, trainingSession.id),
          ),
        );

      return knownWords.map((item) => item.word);
    }),
});
