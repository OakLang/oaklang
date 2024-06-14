import { z } from "zod";

import { and, asc, eq, inArray, sql } from "@acme/db";
import { words } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getTrainingSessionOrThrow } from "../utils";

export const wordsRouter = createTRPCRouter({
  getWords: protectedProcedure
    .input(z.object({ trainingSessionId: z.string() }))
    .query(async ({ ctx: { db, session }, input: { trainingSessionId } }) => {
      const trainingSession = await getTrainingSessionOrThrow(
        trainingSessionId,
        db,
        session,
      );
      const practiceWords = await db
        .select()
        .from(words)
        .where(eq(words.trainingSessionId, trainingSession.id))
        .orderBy(asc(words.createdAt));
      return practiceWords;
    }),
  getKnownWords: protectedProcedure
    .input(z.object({ trainingSessionId: z.string() }))
    .query(async ({ ctx: { db, session }, input: { trainingSessionId } }) => {
      const trainingSession = await getTrainingSessionOrThrow(
        trainingSessionId,
        db,
        session,
      );
      const knownWords = await db
        .select()
        .from(words)
        .where(
          and(
            eq(words.trainingSessionId, trainingSession.id),
            eq(words.isKnown, true),
          ),
        )
        .orderBy(asc(words.createdAt));
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
        const trainingSession = await getTrainingSessionOrThrow(
          trainingSessionId,
          db,
          session,
        );
        const newWords = await db
          .insert(words)
          .values(
            wordsToCreate.map((word) => ({
              word,
              trainingSessionId: trainingSession.id,
              isKnown,
            })),
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
        const trainingSession = await getTrainingSessionOrThrow(
          trainingSessionId,
          db,
          session,
        );

        const deletedWords = await db
          .delete(words)
          .where(
            and(
              eq(words.trainingSessionId, trainingSession.id),
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
        const trainingSession = await getTrainingSessionOrThrow(
          trainingSessionId,
          db,
          session,
        );

        const updatedWords = await db
          .update(words)
          .set({
            ...(typeof data.isKnown !== "undefined"
              ? { isKnown: data.isKnown }
              : {}),
          })
          .where(
            and(
              eq(words.trainingSessionId, trainingSession.id),
              inArray(words.word, wordsToUpdate),
            ),
          )
          .returning();
        return updatedWords;
      },
    ),
});
