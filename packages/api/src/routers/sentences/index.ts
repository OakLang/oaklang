import { openai } from "@ai-sdk/openai";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import stringTemplate from "string-template";
import { z } from "zod";

import { and, asc, createSelectSchema, desc, eq, isNull, not } from "@acme/db";
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
  getPracticeWordsList,
  getSentenceOrThrow,
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
        promptTemplate: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const PRACTICE_WORDS_COUNT = 30;

      const nativeLanguage = await getNativeLanguageOrThrow(ctx);
      const trainingSession = await getTrainingSessionOrThrow(
        input.trainingSessionId,
        db,
        ctx.session,
      );
      const practiceLanguage = await getLanguageOrThrow(
        trainingSession.languageCode,
        ctx.db,
      );

      const model = openai("gpt-4o", { user: ctx.session.user.id });

      const knownWords = await db
        .select({ word: wordsTable.word })
        .from(userWordsTable)
        .innerJoin(wordsTable, eq(wordsTable.id, userWordsTable.wordId))
        .where(
          and(
            eq(userWordsTable.userId, ctx.session.user.id),
            eq(wordsTable.languageCode, practiceLanguage.code),
            not(isNull(userWordsTable.knownAt)),
          ),
        )
        .orderBy(desc(userWordsTable.knownAt))
        .then((res) => res.map((item) => item.word));

      const practiceWordsList = await getPracticeWordsList(
        {
          trainingSession,
          wordCount: PRACTICE_WORDS_COUNT,
          practiceLanguage,
          knownWords,
        },
        ctx,
      );

      const previouslyGeneratedSentences = await db
        .select({
          index: sentencesTable.index,
          sentence: sentencesTable.sentence,
        })
        .from(sentencesTable)
        .where(eq(sentencesTable.trainingSessionId, trainingSession.id))
        .orderBy(asc(sentencesTable.index));

      const TEMPLATE_OBJECT = {
        SENTENCE_COUNT: input.limit,
        PRACTICE_LANGUAGE: practiceLanguage.name,
        NATIVE_LANGUAGE: nativeLanguage.name,
        PRACTICE_WORDS: practiceWordsList.join(", "),
        KNOWN_WORDS: knownWords.join(", "),
        COMPLEXITY: trainingSession.complexity,
        PREVIOUSLY_GENERATED_SENTENCES: previouslyGeneratedSentences
          .map((sen) => `${sen.index}. ${sen.sentence}`)
          .join("\n"),
        TOPIC: trainingSession.topic?.trim(),
      };

      const sentenceGeneratorPrompt = stringTemplate(
        input.promptTemplate,
        TEMPLATE_OBJECT,
      );

      const schema = z.object({
        sentences: z.array(
          z.object({
            sentence: z
              .string()
              .describe(
                stringTemplate(
                  "The full sentence in {PRACTICE_LANGUAGE} language.",
                  TEMPLATE_OBJECT,
                ),
              ),
            translation: z
              .string()
              .describe(
                stringTemplate(
                  "The full sentence translation in {NATIVE_LANGUAGE}",
                  TEMPLATE_OBJECT,
                ),
              ),
          }),
        ),
      });

      const result = await generateObject({
        model,
        prompt: sentenceGeneratorPrompt,
        schema,
      });

      const validatedSentences = result.object.sentences;

      const lastSentenceIndex = previouslyGeneratedSentences.at(-1)?.index ?? 0;

      const newSentences = await db
        .insert(sentencesTable)
        .values(
          validatedSentences.map((sentence, index) => ({
            index: lastSentenceIndex + 1 + index,
            sentence: sentence.sentence,
            translation: sentence.translation,
            trainingSessionId: trainingSession.id,
          })),
        )
        .returning();

      return {
        sentences: newSentences.sort((a, b) => a.index - b.index),
        prompt: sentenceGeneratorPrompt,
      };
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
