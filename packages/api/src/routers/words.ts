import { openai } from "@ai-sdk/openai";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import dayjs from "dayjs";
import ms from "ms";
import { z } from "zod";

import type { PgColumn, SQLWrapper } from "@acme/db";
import { getExtractWordsFromAPieceOfTextPrompt } from "@acme/core/constants/prompt-templates";
import { convertToCSV } from "@acme/core/helpers";
import {
  and,
  asc,
  count,
  createSelectSchema,
  desc,
  eq,
  ilike,
  isNull,
  lte,
  not,
  or,
  sql,
} from "@acme/db";
import { aiUsageTable, userWordsTable, wordsTable } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  getLanguageOrThrow,
  getOrCreateWords,
  getUserSettings,
  insertUserWords,
} from "../utils";
import {
  userWordWithWordSchema,
  wordColumnEnum,
  wordFilterEnum,
} from "../validators";

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
  getUserWords: protectedProcedure
    .input(
      z.object({
        languageCode: z.string(),
        filter: wordFilterEnum.optional().default("all"),
        pageIndex: z.number().min(0).default(0),
        pageSize: z.number().min(10).max(500).default(10),
        sortBy: z.string().optional().default("createdAt"),
        sortDesc: z.boolean().optional().default(false),
        search: z.string().optional(),
      }),
    )
    .output(
      z.object({
        list: z.array(userWordWithWordSchema),
        rowCount: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = and(
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
        ...(input.search
          ? [
              or(
                eq(userWordsTable.wordId, input.search),
                ilike(wordsTable.word, `%${input.search}%`),
              ),
            ]
          : []),
      );

      let sortBy = userWordsTable.createdAt as SQLWrapper;

      if (input.sortBy) {
        if (input.sortBy.startsWith("word_")) {
          sortBy =
            (wordsTable[
              input.sortBy.replace("word_", "") as keyof typeof wordsTable
            ] as SQLWrapper | undefined) ?? userWordsTable.createdAt;
        } else {
          sortBy =
            (userWordsTable[
              input.sortBy.replace("word_", "") as keyof typeof userWordsTable
            ] as SQLWrapper | undefined) ?? userWordsTable.createdAt;
        }
      }

      const list = await ctx.db
        .select()
        .from(userWordsTable)
        .innerJoin(wordsTable, eq(wordsTable.id, userWordsTable.wordId))
        .where(where)
        .limit(input.pageSize)
        .offset(input.pageIndex * input.pageSize)
        .orderBy(
          ...(input.sortDesc ? [desc(sortBy)] : [asc(sortBy)]),
          desc(userWordsTable.wordId),
        );

      const rowCount = await ctx.db
        .select({ count: count() })
        .from(userWordsTable)
        .innerJoin(wordsTable, eq(wordsTable.id, userWordsTable.wordId))
        .where(where)
        .then((res) => res[0]?.count ?? 0);

      return {
        rowCount,
        list: list.map(({ user_word, word }) => ({
          ...user_word,
          word: word,
        })),
      };
    }),
  exportUserWordsAsCSV: protectedProcedure
    .input(
      z.object({
        languageCode: z.string(),
        filter: wordFilterEnum.optional().default("all"),
        search: z.string().optional(),
        columns: z.array(wordColumnEnum).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const where = and(
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
        ...(input.search
          ? [
              or(
                eq(userWordsTable.wordId, input.search),
                ilike(wordsTable.word, `%${input.search}%`),
              ),
            ]
          : []),
      );

      const select: Record<string, PgColumn> = {};

      for (const column of input.columns) {
        if (column === "word") {
          select[column] = wordsTable.word;
          continue;
        }
        select[column] = userWordsTable[column];
      }

      const list = await ctx.db
        .select(select)
        .from(userWordsTable)
        .innerJoin(wordsTable, eq(wordsTable.id, userWordsTable.wordId))
        .where(where)
        .orderBy(desc(userWordsTable.createdAt));

      const csvData = convertToCSV(
        list.map((word) => {
          const result = new Map([...Object.entries(word)]);

          return Object.fromEntries(result.entries());
        }),
      );

      return csvData;
    }),
  addWordsToPracticeListFromPieceOfText: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1).max(1000),
        languageCode: z.string(),
      }),
    )
    .output(z.array(createSelectSchema(wordsTable)))
    .mutation(async ({ ctx, input }) => {
      const language = await getLanguageOrThrow(input.languageCode, ctx.db);

      const model = openai("gpt-4o", { user: ctx.session.user.id });
      const prompt = getExtractWordsFromAPieceOfTextPrompt({
        PIECE_OF_TEXT: input.text,
        LANGUAGE: language.name,
      });
      const schema = z.object({
        lemmas: z.array(z.string()).describe("lemma list"),
      });
      const result = await generateObject({
        model,
        schema,
        prompt,
      });

      await ctx.db.insert(aiUsageTable).values({
        platform: "openai",
        model: "gpt-4o",
        generationType: "object",
        prompt,
        result,
        tokenCount: result.usage.totalTokens,
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email,
        metadata: {
          words: result.object.lemmas,
          zodSchema: schema,
        },
      });

      const uniqueWords = [...new Set(result.object.lemmas)];

      const insertedWords = await getOrCreateWords(
        uniqueWords,
        input.languageCode,
        ctx.db,
      );
      await insertUserWords(insertedWords, ctx.session.user.id, ctx.db);
      return insertedWords;
    }),
  addWordsToPracticeListFromCommaSeparatedList: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1).max(1000),
        languageCode: z.string(),
      }),
    )
    .output(z.array(createSelectSchema(wordsTable)))
    .mutation(async ({ ctx, input }) => {
      const uniqueWords = [
        ...new Set(
          input.text
            .split(",")
            .map((item) => item.trim())
            .filter((item) => !!item),
        ),
      ];
      const insertedWords = await getOrCreateWords(
        uniqueWords,
        input.languageCode,
        ctx.db,
      );
      await insertUserWords(insertedWords, ctx.session.user.id, ctx.db);
      return insertedWords;
    }),
});
