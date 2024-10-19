import { openai } from "@ai-sdk/openai";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import stringTemplate from "string-template";
import { z } from "zod";

import { Exercises } from "@acme/core/constants";
import { and, asc, createSelectSchema, eq } from "@acme/db";
import { db } from "@acme/db/client";
import {
  sentencesTable,
  sentenceWordsTable,
  userWordsTable,
  wordsTable,
} from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../../trpc";
import {
  getLanguageOrThrow,
  getNativeLanguageOrThrow,
  getOrCreateWord,
  getTrainingSessionOrThrow,
  getUserSettings,
} from "../../utils";
import {
  buildSentenceWordsGPTSchema,
  getSentenceOrThrow,
  getSentencesForExercise1,
} from "./helpers";

export const sentencesRouter = createTRPCRouter({
  getSentences: protectedProcedure
    .input(z.object({ trainingSessionId: z.string() }))
    .output(z.array(createSelectSchema(sentencesTable)))
    .query(async ({ ctx: { db, session }, input: { trainingSessionId } }) => {
      const trainingSession = await getTrainingSessionOrThrow(
        trainingSessionId,
        db,
        session,
      );
      return db
        .select()
        .from(sentencesTable)
        .where(eq(sentencesTable.trainingSessionId, trainingSession.id))
        .orderBy(asc(sentencesTable.index));
    }),
  getSentence: protectedProcedure
    .input(z.object({ sentenceId: z.string() }))
    .query(({ ctx, input }) => getSentenceOrThrow(input.sentenceId, ctx)),
  generateSentences: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.string(),
        limit: z.number().min(1).max(10).default(5),
        promptTemplate: z.string().optional(),
      }),
    )
    .output(z.array(createSelectSchema(sentencesTable)))
    .mutation(async ({ ctx, input }) => {
      const trainingSession = await getTrainingSessionOrThrow(
        input.trainingSessionId,
        db,
        ctx.session,
      );

      switch (trainingSession.exercise) {
        case Exercises.exercies1:
          return getSentencesForExercise1(
            trainingSession,
            ctx,
            input.promptTemplate,
          );
        default:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unsupported exercise!",
          });
      }
    }),
  getSentenceWords: protectedProcedure
    .input(z.object({ sentenceId: z.string(), promptTemplate: z.string() }))
    .output(
      z.array(
        createSelectSchema(sentenceWordsTable, {
          interlinearLines: z.object({}).catchall(z.string()),
        }).extend({
          userWord: createSelectSchema(userWordsTable).nullable(),
          word: createSelectSchema(wordsTable),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      const list = await db
        .select()
        .from(sentenceWordsTable)
        .innerJoin(wordsTable, eq(wordsTable.id, sentenceWordsTable.wordId))
        .leftJoin(
          userWordsTable,
          eq(userWordsTable.wordId, sentenceWordsTable.wordId),
        )
        .where(eq(sentenceWordsTable.sentenceId, input.sentenceId))
        .orderBy(asc(sentenceWordsTable.index));

      if (list.length > 0) {
        return list.map((item) => ({
          ...item.sentence_word,
          userWord: item.user_word,
          word: item.word,
        }));
      }

      const userSettings = await getUserSettings(ctx);
      const nativeLanguage = await getNativeLanguageOrThrow(ctx, userSettings);
      const sentence = await getSentenceOrThrow(input.sentenceId, ctx);
      const trainingSession = await getTrainingSessionOrThrow(
        sentence.trainingSessionId,
        ctx.db,
        ctx.session,
      );
      const practiceLanguage = await getLanguageOrThrow(
        trainingSession.languageCode,
        ctx.db,
      );

      const prompt = stringTemplate(input.promptTemplate, {
        PRACTICE_LANGUAGE: practiceLanguage.name,
        NATIVE_LANGUAGE: nativeLanguage.name,
        SENTENCE: sentence.sentence,
      });

      const schema = buildSentenceWordsGPTSchema({
        nativeLanguage,
        practiceLanguage,
        userSettings,
      });

      const result = await generateObject({
        model: openai("gpt-4o", { user: ctx.session.user.id }),
        prompt,
        schema,
      });

      const filterdWords = result.object.words as unknown as {
        word: string;
        lemma: string;
        text: string;
        [x: string]: string;
      }[];

      const newList = await Promise.all(
        filterdWords.map(async (item, index) => {
          const primaryWord = item.lemma;
          const word = await getOrCreateWord(
            primaryWord,
            practiceLanguage.code,
            db,
          );
          const [userWord] = await db
            .select()
            .from(userWordsTable)
            .where(
              and(
                eq(userWordsTable.userId, ctx.session.user.id),
                eq(userWordsTable.wordId, word.id),
              ),
            );

          const [sentenceWord] = await db
            .insert(sentenceWordsTable)
            .values({
              interlinearLines: item,
              index,
              sentenceId: sentence.id,
              wordId: word.id,
            })
            .returning();
          if (!sentenceWord) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
          }
          return { sentenceWord, word, userWord };
        }),
      );

      return newList
        .map((item) => ({
          ...item.sentenceWord,
          word: item.word,
          userWord: item.userWord ?? null,
        }))
        .sort((a, b) => a.index - b.index);
    }),
});
