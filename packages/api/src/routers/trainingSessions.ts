import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, count, desc, eq, sql } from "@acme/db";
import {
  languages,
  practiceLanguages,
  trainingSessions,
  trainingSessionWords,
  userWords,
  words,
} from "@acme/db/schema";
import {
  createTrainingSessionInput,
  updateTrainingSessionInput,
} from "@acme/db/validators";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getTrainingSessionOrThrow } from "../utils";

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
          topic: trainingSessions.topic,
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

      return await Promise.all(
        trainingSessionList.map(async (ts) => {
          const [newWords] = await db
            .select({ count: count() })
            .from(userWords)
            .where(eq(userWords.createdFromId, ts.id));
          const [knownWords] = await db
            .select({ count: count() })
            .from(userWords)
            .where(eq(userWords.knownFromId, ts.id));

          return {
            ...ts,
            newWordsCount: newWords?.count ?? 0,
            knownWordsCount: knownWords?.count ?? 0,
          };
        }),
      );
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
          title: opts.input.title,
          userId: opts.ctx.session.user.id,
          topic: opts.input.topic,
        })
        .returning();

      if (!trainingSession) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create training session",
        });
      }

      if (opts.input.words && opts.input.words.length > 0) {
        const insertedWords = await opts.ctx.db
          .insert(words)
          .values(
            opts.input.words.map((word) => ({
              word,
              languageCode: opts.input.languageCode,
            })),
          )
          .onConflictDoUpdate({
            target: [words.word, words.languageCode],
            set: {
              word: sql`${words.word}`,
              languageCode: sql`${words.languageCode}`,
            },
          })
          .returning({ id: words.id });

        await opts.ctx.db
          .insert(userWords)
          .values(
            insertedWords.map((word) => ({
              userId: opts.ctx.session.user.id,
              wordId: word.id,
            })),
          )
          .onConflictDoNothing();

        await opts.ctx.db
          .insert(trainingSessionWords)
          .values(
            insertedWords.map((word) => ({
              wordId: word.id,
              trainingSessionId: trainingSession.id,
            })),
          )
          .onConflictDoNothing();
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
