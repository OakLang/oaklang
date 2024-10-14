import { openai } from "@ai-sdk/openai";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import dayjs from "dayjs";
import ms from "ms";
import { z } from "zod";

import { and, asc, eq, isNull, lte, not, or, sql } from "@acme/db";
import { userWordsTable, wordsTable } from "@acme/db/schema";

import type { UserWordWithWord } from "../validators";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getLanguageOrThrow, getUserSettings } from "../utils";
import { userWordWithWordSchema } from "../validators";

export const wordsRouter = createTRPCRouter({
  getUserWord: protectedProcedure
    .input(z.object({ wordId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [word] = await ctx.db
        .select()
        .from(userWordsTable)
        .innerJoin(wordsTable, eq(wordsTable.id, userWordsTable.wordId))
        .where(
          and(
            eq(userWordsTable.wordId, input.wordId),
            eq(userWordsTable.userId, ctx.session.user.id),
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
        .insert(userWordsTable)
        .values({
          wordId: input.wordId,
          userId: ctx.session.user.id,
          lastSeenAt: new Date(),
          seenCount: 1,
          seenCountSinceLastPracticed: 1,
          createdFromId: input.sessionId,
        })
        .onConflictDoUpdate({
          target: [userWordsTable.userId, userWordsTable.wordId],
          set: {
            lastSeenAt: sql`NOW()`,
            seenCount: sql`${userWordsTable.seenCount} + 1`,
            seenCountSinceLastPracticed: sql`${userWordsTable.seenCountSinceLastPracticed} + 1`,
          },
        })
        .returning();

      if (!userWord) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Word not found!" });
      }

      if (userWord.knownAt) {
        return;
      }
      const userSettings = await getUserSettings(ctx);

      const spacedRepetitionStage = userSettings.spacedRepetitionStages.find(
        (stage) => stage.iteration === userWord.spacedRepetitionStage,
      );
      if (!spacedRepetitionStage) {
        await ctx.db
          .update(userWordsTable)
          .set({
            knownAt: new Date(),
            knownFromId: input.sessionId,
            hideLines: true,
          })
          .where(
            and(
              eq(userWordsTable.userId, userWord.userId),
              eq(userWordsTable.wordId, userWord.wordId),
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
          .update(userWordsTable)
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
              eq(userWordsTable.userId, userWord.userId),
              eq(userWordsTable.wordId, userWord.wordId),
            ),
          );
      }
    }),
  markWordKnown: protectedProcedure
    .input(z.object({ wordId: z.string(), sessionId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userWordsTable)
        .values({
          knownAt: new Date(),
          userId: ctx.session.user.id,
          wordId: input.wordId,
          knownFromId: input.sessionId,
          hideLines: true,
        })
        .onConflictDoUpdate({
          target: [userWordsTable.userId, userWordsTable.wordId],
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
        .insert(userWordsTable)
        .values({
          userId: ctx.session.user.id,
          wordId: input.wordId,
        })
        .onConflictDoUpdate({
          target: [userWordsTable.userId, userWordsTable.wordId],
          set: {
            knownAt: null,
            knownFromId: null,
            hideLines: false,
            lastMarkedUnknownAt: sql`NOW()`,
            markedUnknownCount: sql`${userWordsTable.markedUnknownCount} + 1`,
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
        .select()
        .from(userWordsTable)
        .where(
          and(
            eq(userWordsTable.userId, ctx.session.user.id),
            eq(userWordsTable.wordId, input.wordId),
          ),
        );

      if (!word) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User Word not found!",
        });
      }

      const data: Partial<typeof userWordsTable.$inferInsert> = {};

      if (typeof input.hideLines !== "undefined") {
        data.hideLines = input.hideLines;
        if (!data.hideLines) {
          data.dissableHideLinesCount = word.dissableHideLinesCount + 1;
          data.lastDissabledHideLinesAt = new Date();
        }
      }

      const [updatedWord] = await ctx.db
        .update(userWordsTable)
        .set(data)
        .where(
          and(
            eq(userWordsTable.userId, word.userId),
            eq(userWordsTable.wordId, word.wordId),
          ),
        )
        .returning();
      if (!updatedWord) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      return updatedWord;
    }),
  deleteUserWord: protectedProcedure
    .input(z.object({ wordId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(userWordsTable)
        .where(
          and(
            eq(userWordsTable.userId, ctx.session.user.id),
            eq(userWordsTable.wordId, input.wordId),
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
    .output(z.array(userWordWithWordSchema))
    .query(async ({ ctx, input }) => {
      const list = await ctx.db
        .select()
        .from(userWordsTable)
        .innerJoin(wordsTable, eq(wordsTable.id, userWordsTable.wordId))
        .where(
          and(
            eq(userWordsTable.userId, ctx.session.user.id),
            eq(wordsTable.languageCode, input.languageCode),
            ...(input.filter === "known"
              ? [not(isNull(userWordsTable.knownAt))]
              : input.filter === "unknown"
                ? [isNull(userWordsTable.knownAt)]
                : input.filter === "practicing"
                  ? [
                      isNull(userWordsTable.knownAt),
                      or(
                        isNull(userWordsTable.nextPracticeAt),
                        lte(userWordsTable.nextPracticeAt, sql`NOW()`),
                      ),
                    ]
                  : []),
          ),
        )
        .orderBy(asc(userWordsTable.wordId));
      return list.map(({ user_word, word }) => ({
        ...user_word,
        word: word.word,
        languageCode: word.languageCode,
      }));
    }),
  getAllPracticeWords: protectedProcedure
    .input(
      z.object({
        languageCode: z.string(),
      }),
    )
    .output(z.array(userWordWithWordSchema))
    .query(async ({ ctx, input }) => {
      const list = await ctx.db
        .select()
        .from(userWordsTable)
        .innerJoin(wordsTable, eq(wordsTable.id, userWordsTable.wordId))
        .where(
          and(
            eq(userWordsTable.userId, ctx.session.user.id),
            eq(wordsTable.languageCode, input.languageCode),
            isNull(userWordsTable.knownAt),
          ),
        )
        .orderBy(asc(userWordsTable.wordId));
      return list.map(({ user_word, word }) => ({
        ...user_word,
        word: word.word,
        languageCode: word.languageCode,
      }));
    }),
  getAllKnownWords: protectedProcedure
    .input(
      z.object({
        languageCode: z.string(),
      }),
    )
    .output(z.array(userWordWithWordSchema))
    .query(async ({ ctx, input }) => {
      const list = await ctx.db
        .select()
        .from(userWordsTable)
        .innerJoin(wordsTable, eq(wordsTable.id, userWordsTable.wordId))
        .where(
          and(
            eq(userWordsTable.userId, ctx.session.user.id),
            eq(wordsTable.languageCode, input.languageCode),
            not(isNull(userWordsTable.knownAt)),
          ),
        )
        .orderBy(asc(userWordsTable.wordId));
      return list.map(({ user_word, word }) => ({
        ...user_word,
        word: word.word,
        languageCode: word.languageCode,
      }));
    }),
  addWordsToPracticeListFromPieceOfText: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1).max(1000),
        languageCode: z.string(),
      }),
    )
    .output(z.array(userWordWithWordSchema))
    .mutation(async ({ ctx, input }) => {
      const language = await getLanguageOrThrow(input.languageCode, ctx.db);

      const model = openai("gpt-4o", { user: ctx.session.user.id });
      const result = await generateObject({
        model,
        schema: z.object({
          lemmas: z.array(z.string()).describe("lemma list"),
        }),
        prompt: `Please extract all the words from the following text and return each word in its lemma form in ${language.name} language. Ensure no word is omitted, and return each lemma only once, without repetition. Once a lemma has been listed, it should not appear again. Maintain the order of their first appearance. The text is as follows:\n\n${input.text}`,
      });
      const uniqueWords = [...new Set(result.object.lemmas)];

      const insertedWords = await ctx.db
        .insert(wordsTable)
        .values(
          uniqueWords.map(
            (word) =>
              ({
                languageCode: input.languageCode,
                word,
              }) satisfies typeof wordsTable.$inferInsert,
          ),
        )
        .onConflictDoUpdate({
          target: [wordsTable.word, wordsTable.languageCode],
          set: {
            word: sql`${wordsTable.word}`,
            languageCode: sql`${wordsTable.languageCode}`,
          },
        })
        .returning();

      const practiceWordsList = await ctx.db
        .insert(userWordsTable)
        .values(
          insertedWords.map(
            (word) =>
              ({
                userId: ctx.session.user.id,
                wordId: word.id,
              }) satisfies typeof userWordsTable.$inferInsert,
          ),
        )
        .onConflictDoUpdate({
          target: [userWordsTable.userId, userWordsTable.wordId],
          set: {
            userId: sql`${userWordsTable.userId}`,
            wordId: sql`${userWordsTable.wordId}`,
          },
        })
        .returning();

      return practiceWordsList
        .map((userWord) => {
          const word = insertedWords.find((w) => w.id === userWord.wordId);
          if (!word) {
            return null;
          }
          return {
            ...userWord,
            word: word.word,
            languageCode: word.languageCode,
          } satisfies UserWordWithWord;
        })
        .filter((item) => !!item);
    }),
  addWordsToPracticeListFromCommaSeparatedList: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1).max(1000),
        languageCode: z.string(),
      }),
    )
    .output(z.array(userWordWithWordSchema))
    .mutation(async ({ ctx, input }) => {
      // const language = await getLanguageOrThrow(input.languageCode, ctx.db);

      // const model = openai("gpt-4o", { user: ctx.session.user.id });
      // const result = await generateObject({
      //   model,
      //   schema: z.object({
      //     lemmas: z.array(z.string()).describe("lemma list"),
      //   }),
      //   prompt: `Please extract all the words from the following text and return each word in its lemma form in ${language.name} language. Ensure no word is omitted, and return each lemma only once, without repetition. Once a lemma has been listed, it should not appear again. Maintain the order of their first appearance. The text is as follows:\n\n${input.text}`,
      // });
      const uniqueWords = [
        ...new Set(
          input.text
            .split(",")
            .map((item) => item.trim())
            .filter((item) => !!item),
        ),
      ];

      const insertedWords = await ctx.db
        .insert(wordsTable)
        .values(
          uniqueWords.map(
            (word) =>
              ({
                languageCode: input.languageCode,
                word,
              }) satisfies typeof wordsTable.$inferInsert,
          ),
        )
        .onConflictDoUpdate({
          target: [wordsTable.word, wordsTable.languageCode],
          set: {
            word: sql`${wordsTable.word}`,
            languageCode: sql`${wordsTable.languageCode}`,
          },
        })
        .returning();

      const practiceWordsList = await ctx.db
        .insert(userWordsTable)
        .values(
          insertedWords.map(
            (word) =>
              ({
                userId: ctx.session.user.id,
                wordId: word.id,
              }) satisfies typeof userWordsTable.$inferInsert,
          ),
        )
        .onConflictDoUpdate({
          target: [userWordsTable.userId, userWordsTable.wordId],
          set: {
            userId: sql`${userWordsTable.userId}`,
            wordId: sql`${userWordsTable.wordId}`,
          },
        })
        .returning();

      return practiceWordsList
        .map((userWord) => {
          const word = insertedWords.find((w) => w.id === userWord.wordId);
          if (!word) {
            return null;
          }
          return {
            ...userWord,
            word: word.word,
            languageCode: word.languageCode,
          } satisfies UserWordWithWord;
        })
        .filter((item) => !!item);
    }),
});
