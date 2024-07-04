import { z } from "zod";

import { and, asc, eq, inArray } from "@acme/db";
import { words } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getTrainingSessionOrThrow } from "../utils";

export const wordsRouter = createTRPCRouter({
  getWords: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.string(),
        isKnown: z.boolean().optional(),
        isPracticing: z.boolean().optional(),
      }),
    )
    .query(
      async ({
        ctx: { db, session },
        input: { trainingSessionId, isKnown, isPracticing },
      }) => {
        const trainingSession = await getTrainingSessionOrThrow(
          trainingSessionId,
          db,
          session,
        );
        const practiceWords = await db
          .select()
          .from(words)
          .where(
            and(
              eq(words.trainingSessionId, trainingSession.id),
              ...(typeof isPracticing !== "undefined"
                ? [eq(words.isPracticing, isPracticing)]
                : []),
              ...(typeof isKnown !== "undefined"
                ? [eq(words.isKnown, isKnown)]
                : []),
            ),
          )
          .orderBy(asc(words.createdAt));
        return practiceWords;
      },
    ),
  createWords: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.string(),
        words: z.array(z.string()).min(1).max(100),
        isKnown: z.boolean().optional(),
        isPracticing: z.boolean().optional(),
      }),
    )
    .mutation(
      async ({
        ctx: { db, session },
        input: {
          trainingSessionId,
          words: wordsToCreate,
          isKnown,
          isPracticing,
        },
      }) => {
        const trainingSession = await getTrainingSessionOrThrow(
          trainingSessionId,
          db,
          session,
        );
        const newWords = await db
          .insert(words)
          .values(
            wordsToCreate.map(
              (word) =>
                ({
                  word,
                  trainingSessionId: trainingSession.id,
                  isKnown,
                  isPracticing,
                }) satisfies typeof words.$inferInsert,
            ),
          )
          .onConflictDoUpdate({
            target: [words.trainingSessionId, words.word],
            set: {
              isKnown,
              isPracticing,
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
        data: z.object({
          isKnown: z.boolean().optional(),
          isPracticing: z.boolean().optional(),
        }),
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
            isKnown: data.isKnown,
            isPracticing: data.isPracticing,
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
