import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, count, desc, eq } from "@acme/db";
import {
  languagesTable,
  practiceLanguagesTable,
  trainingSessionsTable,
  trainingSessionWordsTable,
  userWordsTable,
} from "@acme/db/schema";
import {
  createTrainingSessionInput,
  updateTrainingSessionInput,
} from "@acme/db/validators";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  getOrCreateWords,
  getTrainingSessionOrThrow,
  insertUserWords,
} from "../utils";

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
        limit: z.number().optional().default(10),
        cursor: z.number().optional().default(0),
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
        .limit(input.limit)
        .offset(input.cursor)
        .orderBy(desc(trainingSessionsTable.createdAt));

      const list = await Promise.all(
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

      return {
        list,
        nextCursor:
          list.length === input.limit ? input.cursor + input.limit : null,
      };
    }),
  createTrainingSession: protectedProcedure
    .input(createTrainingSessionInput)
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
          languageCode: language.code,
          complexity: input.complexity,
          title: input.title,
          userId: ctx.session.user.id,
          topic: input.topic,
        })
        .returning();

      if (!trainingSession) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create training session",
        });
      }

      if (input.words && input.words.length > 0) {
        const words = await getOrCreateWords(
          input.words,
          input.languageCode,
          ctx.db,
        );
        if (words.length > 0) {
          await insertUserWords(words, ctx.session.user.id, ctx.db);
          await ctx.db
            .insert(trainingSessionWordsTable)
            .values(
              words.map((word) => ({
                wordId: word.id,
                trainingSessionId: trainingSession.id,
              })),
            )
            .onConflictDoNothing();
        }
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
