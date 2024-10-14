import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, count, desc, eq, sql } from "@acme/db";
import {
  languagesTable,
  practiceLanguagesTable,
  trainingSessionsTable,
  trainingSessionWordsTable,
  userWordsTable,
  wordsTable,
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
          id: trainingSessionsTable.id,
          createdAt: trainingSessionsTable.createdAt,
          userId: trainingSessionsTable.userId,
          title: trainingSessionsTable.title,
          sentenceIndex: trainingSessionsTable.sentenceIndex,
          complexity: trainingSessionsTable.complexity,
          languageCode: trainingSessionsTable.languageCode,
          languageName: languagesTable.name,
          topic: trainingSessionsTable.topic,
        })
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
        .orderBy(desc(trainingSessionsTable.id));

      return await Promise.all(
        trainingSessionList.map(async (ts) => {
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
    }),
  createTrainingSession: protectedProcedure
    .input(createTrainingSessionInput)
    .mutation(async (opts) => {
      const [language] = await opts.ctx.db
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
            eq(practiceLanguagesTable.languageCode, opts.input.languageCode),
            eq(practiceLanguagesTable.userId, opts.ctx.session.user.id),
          ),
        );
      if (!language) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Practice language not found!",
        });
      }

      const [trainingSession] = await opts.ctx.db
        .insert(trainingSessionsTable)
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
          .insert(wordsTable)
          .values(
            opts.input.words.map((word) => ({
              word,
              languageCode: opts.input.languageCode,
            })),
          )
          .onConflictDoUpdate({
            target: [wordsTable.word, wordsTable.languageCode],
            set: {
              word: sql`${wordsTable.word}`,
              languageCode: sql`${wordsTable.languageCode}`,
            },
          })
          .returning({ id: wordsTable.id });

        await opts.ctx.db
          .insert(userWordsTable)
          .values(
            insertedWords.map((word) => ({
              userId: opts.ctx.session.user.id,
              wordId: word.id,
            })),
          )
          .onConflictDoNothing();

        await opts.ctx.db
          .insert(trainingSessionWordsTable)
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
          .update(trainingSessionsTable)
          .set(data)
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
});
