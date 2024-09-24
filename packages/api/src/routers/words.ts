import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import ms from "ms";
import { z } from "zod";

import { SPACED_REPETITION_STAGES } from "@acme/core/constants";
import { and, eq, sql } from "@acme/db";
import { userWords, words } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getCurrentPracticeWords } from "../utils";

export const wordsRouter = createTRPCRouter({
  getUserWord: protectedProcedure
    .input(z.object({ wordId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [word] = await ctx.db
        .select()
        .from(userWords)
        .innerJoin(words, eq(words.id, userWords.wordId))
        .where(
          and(
            eq(userWords.wordId, input.wordId),
            eq(userWords.userId, ctx.session.user.id),
          ),
        );
      if (!word) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Word not found!" });
      }
      return {
        ...word.user_word,
        word: word.word,
      };
    }),
  seenWord: protectedProcedure
    .input(z.object({ wordId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [userWord] = await ctx.db
        .insert(userWords)
        .values({
          wordId: input.wordId,
          userId: ctx.session.user.id,
          lastSeenAt: new Date(),
          seenCount: 1,
          seenCountSinceLastPracticed: 1,
        })
        .onConflictDoUpdate({
          target: [userWords.userId, userWords.wordId],
          set: {
            lastSeenAt: sql`NOW()`,
            seenCount: sql`${userWords.seenCount} + 1`,
            seenCountSinceLastPracticed: sql`${userWords.seenCountSinceLastPracticed} + 1`,
          },
        })
        .returning();

      if (!userWord) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Word not found!" });
      }

      if (userWord.knownAt) {
        return;
      }

      const spacedRepetitionStage = SPACED_REPETITION_STAGES.find(
        (stage) => stage.iteration === userWord.spacedRepetitionStage,
      );
      if (!spacedRepetitionStage) {
        await ctx.db
          .update(userWords)
          .set({
            knownAt: new Date(),
          })
          .where(
            and(
              eq(userWords.userId, userWord.userId),
              eq(userWords.wordId, userWord.wordId),
            ),
          );
        return;
      }

      if (
        userWord.seenCountSinceLastPracticed >=
        spacedRepetitionStage.repetitions
      ) {
        // This stage practice is done
        const nextSpacedRepetitionStage = SPACED_REPETITION_STAGES.find(
          (stage) => stage.iteration === spacedRepetitionStage.iteration + 1,
        );

        await ctx.db
          .update(userWords)
          .set({
            lastPracticedAt: new Date(),
            practiceCount: userWord.practiceCount + 1,
            seenCountSinceLastPracticed: 0,
            ...(nextSpacedRepetitionStage
              ? {
                  spacedRepetitionStage: nextSpacedRepetitionStage.iteration,
                  nextPracticeAt: dayjs(new Date())
                    .add(ms(nextSpacedRepetitionStage.waitTime), "ms")
                    .toDate(),
                }
              : {
                  knownAt: new Date(),
                }),
          })
          .where(
            and(
              eq(userWords.userId, userWord.userId),
              eq(userWords.wordId, userWord.wordId),
            ),
          );
      }
    }),
  getCurrentPracticeWords: protectedProcedure
    .input(z.object({ languageCode: z.string() }))
    .query(({ ctx, input }) =>
      getCurrentPracticeWords({
        db: ctx.db,
        languageCode: input.languageCode,
        session: ctx.session,
      }),
    ),
  markWordKnown: protectedProcedure
    .input(z.object({ wordId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userWords)
        .values({
          knownAt: new Date(),
          userId: ctx.session.user.id,
          wordId: input.wordId,
        })
        .onConflictDoUpdate({
          target: [userWords.userId, userWords.wordId],
          set: {
            knownAt: new Date(),
          },
        });
    }),
  markWordUnknown: protectedProcedure
    .input(z.object({ wordId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userWords)
        .values({
          userId: ctx.session.user.id,
          wordId: input.wordId,
        })
        .onConflictDoUpdate({
          target: [userWords.userId, userWords.wordId],
          set: {
            knownAt: null,
          },
        });
    }),
});
