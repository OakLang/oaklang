import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, eq, inArray, sql } from "@acme/db";
import { trainingSessions, words } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const wordsRouter = createTRPCRouter({
  getWords: protectedProcedure
    .input(z.object({ trainingSessionId: z.string() }))
    .query(async ({ ctx: { db, session }, input: { trainingSessionId } }) => {
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
      const practiceWords = await db
        .select()
        .from(words)
        .where(eq(words.trainingSessionId, trainingSessionId));
      return practiceWords;
    }),
  getKnownWords: protectedProcedure
    .input(z.object({ trainingSessionId: z.string() }))
    .query(async ({ ctx: { db, session }, input: { trainingSessionId } }) => {
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
      const knownWords = await db
        .select()
        .from(words)
        .where(
          and(
            eq(words.trainingSessionId, trainingSessionId),
            eq(words.isKnown, true),
          ),
        );
      return knownWords;
    }),
  createWords: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.string(),
        words: z.array(z.string()).min(1).max(100),
        isKnown: z.boolean().optional(),
      }),
    )
    .mutation(
      async ({
        ctx: { db, session },
        input: { trainingSessionId, words: wordsToCreate, isKnown },
      }) => {
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
        const newWords = await db
          .insert(words)
          .values(
            wordsToCreate.map((word) => ({ word, trainingSessionId, isKnown })),
          )
          .onConflictDoUpdate({
            target: [words.trainingSessionId, words.word],
            set: {
              isKnown: sql.raw(`excluded.${words.isKnown.name}`),
            },
          })
          .returning();
        return newWords;
      },
    ),
  deleteWords: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.string(),
        words: z.array(z.string()).min(1).max(100),
      }),
    )
    .mutation(
      async ({
        ctx: { db, session },
        input: { trainingSessionId, words: wordsToDelete },
      }) => {
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

        const deletedWords = await db
          .delete(words)
          .where(
            and(
              eq(words.trainingSessionId, trainingSessionId),
              inArray(words.word, wordsToDelete),
            ),
          )
          .returning();

        return deletedWords;
      },
    ),
  updateWords: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.string(),
        words: z.array(z.string()).min(1).max(100),
        data: z.object({ isKnown: z.boolean().optional() }),
      }),
    )
    .mutation(
      async ({
        ctx: { db, session },
        input: { trainingSessionId, words: wordsToUpdate, data },
      }) => {
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

        const updatedWords = await db
          .update(words)
          .set({
            ...(typeof data.isKnown !== "undefined"
              ? { isKnown: data.isKnown }
              : {}),
          })
          .where(
            and(
              eq(words.trainingSessionId, trainingSessionId),
              inArray(words.word, wordsToUpdate),
            ),
          )
          .returning();
        return updatedWords;
      },
    ),
});
