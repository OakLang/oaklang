import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import ms from "ms";
import { z } from "zod";

import { and, asc, eq, isNull, lte, not, or, sql } from "@acme/db";
import { userWords, words } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getUserSettings, userWordsSelect } from "../utils";

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
    .input(z.object({ wordId: z.string(), sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [userWord] = await ctx.db
        .insert(userWords)
        .values({
          wordId: input.wordId,
          userId: ctx.session.user.id,
          lastSeenAt: new Date(),
          seenCount: 1,
          seenCountSinceLastPracticed: 1,
          createdFromId: input.sessionId,
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
      const userSettings = await getUserSettings(ctx.session.user.id, ctx.db);

      const spacedRepetitionStage = userSettings.spacedRepetitionStages.find(
        (stage) => stage.iteration === userWord.spacedRepetitionStage,
      );
      if (!spacedRepetitionStage) {
        await ctx.db
          .update(userWords)
          .set({
            knownAt: new Date(),
            knownFromId: input.sessionId,
            hideLines: true,
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
        const nextSpacedRepetitionStage =
          userSettings.spacedRepetitionStages.find(
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
                  knownFromId: input.sessionId,
                  hideLines: true,
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
  markWordKnown: protectedProcedure
    .input(z.object({ wordId: z.string(), sessionId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userWords)
        .values({
          knownAt: new Date(),
          userId: ctx.session.user.id,
          wordId: input.wordId,
          knownFromId: input.sessionId,
          hideLines: true,
        })
        .onConflictDoUpdate({
          target: [userWords.userId, userWords.wordId],
          set: {
            knownAt: new Date(),
            knownFromId: input.sessionId,
            hideLines: true,
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
            knownFromId: null,
            hideLines: false,
          },
        });
    }),
  updateUserWord: protectedProcedure
    .input(
      z.object({
        wordId: z.string(),
        hideLines: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [word] = await ctx.db
        .update(userWords)
        .set({
          hideLines: input.hideLines,
        })
        .where(
          and(
            eq(userWords.userId, ctx.session.user.id),
            eq(userWords.wordId, input.wordId),
          ),
        )
        .returning();
      if (!word) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      return word;
    }),
  deleteWord: protectedProcedure
    .input(z.object({ wordId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(userWords)
        .where(
          and(
            eq(userWords.userId, ctx.session.user.id),
            eq(userWords.wordId, input.wordId),
          ),
        );
    }),
  getAllWords: protectedProcedure
    .input(
      z.object({
        languageCode: z.string(),
        filter: z
          .enum(["all", "known", "unknown", "practicing"])
          .default("all"),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select(userWordsSelect)
        .from(userWords)
        .innerJoin(words, eq(words.id, userWords.wordId))
        .where(
          and(
            eq(userWords.userId, ctx.session.user.id),
            eq(words.languageCode, input.languageCode),
            ...(input.filter === "known"
              ? [not(isNull(userWords.knownAt))]
              : input.filter === "unknown"
                ? [isNull(userWords.knownAt)]
                : input.filter === "practicing"
                  ? [
                      isNull(userWords.knownAt),
                      or(
                        isNull(userWords.nextPracticeAt),
                        lte(userWords.nextPracticeAt, sql`NOW()`),
                      ),
                    ]
                  : []),
          ),
        )
        .orderBy(asc(userWords.wordId));
    }),
  getAllPracticeWords: protectedProcedure
    .input(
      z.object({
        languageCode: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select(userWordsSelect)
        .from(userWords)
        .innerJoin(words, eq(words.id, userWords.wordId))
        .where(
          and(
            eq(userWords.userId, ctx.session.user.id),
            eq(words.languageCode, input.languageCode),
            isNull(userWords.knownAt),
          ),
        )
        .orderBy(asc(userWords.wordId));
    }),
  getAllKnownWords: protectedProcedure
    .input(
      z.object({
        languageCode: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select(userWordsSelect)
        .from(userWords)
        .innerJoin(words, eq(words.id, userWords.wordId))
        .where(
          and(
            eq(userWords.userId, ctx.session.user.id),
            eq(words.languageCode, input.languageCode),
            not(isNull(userWords.knownAt)),
          ),
        )
        .orderBy(asc(userWords.wordId));
    }),
});
