import { openai } from "@ai-sdk/openai";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import dayjs from "dayjs";
import ms from "ms";
import { z } from "zod";

import { and, asc, eq, isNull, lte, not, or, sql } from "@acme/db";
import { languages, userWords, words } from "@acme/db/schema";

import type { UserWordWithWord } from "../validators";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getUserSettings } from "../utils";
import { userWordWithWordSchema } from "../validators";

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
            lastMarkedUnknownAt: sql`NOW()`,
            markedUnknownCount: sql`${userWords.markedUnknownCount} + 1`,
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
        .from(userWords)
        .where(
          and(
            eq(userWords.userId, ctx.session.user.id),
            eq(userWords.wordId, input.wordId),
          ),
        );

      if (!word) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User Word not found!",
        });
      }

      const data: Partial<typeof userWords.$inferInsert> = {};

      if (typeof input.hideLines !== "undefined") {
        data.hideLines = input.hideLines;
        if (!data.hideLines) {
          data.dissableHideLinesCount = word.dissableHideLinesCount + 1;
          data.lastDissabledHideLinesAt = new Date();
        }
      }

      const [updatedWord] = await ctx.db
        .update(userWords)
        .set(data)
        .where(
          and(
            eq(userWords.userId, word.userId),
            eq(userWords.wordId, word.wordId),
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
    .output(z.array(userWordWithWordSchema))
    .query(async ({ ctx, input }) => {
      const list = await ctx.db
        .select()
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
      const [language] = await ctx.db
        .select()
        .from(languages)
        .where(eq(languages.code, input.languageCode));

      if (!language) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Language not found!",
        });
      }

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
        .insert(words)
        .values(
          uniqueWords.map(
            (word) =>
              ({
                languageCode: input.languageCode,
                word,
              }) satisfies typeof words.$inferInsert,
          ),
        )
        .onConflictDoUpdate({
          target: [words.word, words.languageCode],
          set: {
            word: sql`${words.word}`,
            languageCode: sql`${words.languageCode}`,
          },
        })
        .returning();

      const practiceWordsList = await ctx.db
        .insert(userWords)
        .values(
          insertedWords.map(
            (word) =>
              ({
                userId: ctx.session.user.id,
                wordId: word.id,
              }) satisfies typeof userWords.$inferInsert,
          ),
        )
        .onConflictDoUpdate({
          target: [userWords.userId, userWords.wordId],
          set: {
            userId: sql`${userWords.userId}`,
            wordId: sql`${userWords.wordId}`,
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
      const [language] = await ctx.db
        .select()
        .from(languages)
        .where(eq(languages.code, input.languageCode));

      if (!language) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Language not found!",
        });
      }

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
        .insert(words)
        .values(
          uniqueWords.map(
            (word) =>
              ({
                languageCode: input.languageCode,
                word,
              }) satisfies typeof words.$inferInsert,
          ),
        )
        .onConflictDoUpdate({
          target: [words.word, words.languageCode],
          set: {
            word: sql`${words.word}`,
            languageCode: sql`${words.languageCode}`,
          },
        })
        .returning();

      const practiceWordsList = await ctx.db
        .insert(userWords)
        .values(
          insertedWords.map(
            (word) =>
              ({
                userId: ctx.session.user.id,
                wordId: word.id,
              }) satisfies typeof userWords.$inferInsert,
          ),
        )
        .onConflictDoUpdate({
          target: [userWords.userId, userWords.wordId],
          set: {
            userId: sql`${userWords.userId}`,
            wordId: sql`${userWords.wordId}`,
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
