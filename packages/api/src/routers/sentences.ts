import type { ZodString } from "zod";
import { openai } from "@ai-sdk/openai";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import stringTemplate from "string-template";
import { z } from "zod";

import type { Language, UserSettings } from "@acme/db/schema";
import { and, asc, createSelectSchema, desc, eq, isNull, not } from "@acme/db";
import { db } from "@acme/db/client";
import {
  languages,
  sentences,
  sentenceWords,
  userWords,
  words,
} from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  getCurrentPracticeWords,
  getOrCreateWord,
  getTrainingSessionOrThrow,
  getUserSettings,
} from "../utils";

export const sentencesRouter = createTRPCRouter({
  getSentences: protectedProcedure
    .input(z.object({ trainingSessionId: z.string() }))
    .output(z.array(createSelectSchema(sentences)))
    .query(async ({ ctx: { db, session }, input: { trainingSessionId } }) => {
      const trainingSession = await getTrainingSessionOrThrow(
        trainingSessionId,
        db,
        session,
      );
      return db
        .select()
        .from(sentences)
        .where(eq(sentences.trainingSessionId, trainingSession.id))
        .orderBy(asc(sentences.index));
    }),
  getSentence: protectedProcedure
    .input(z.object({ sentenceId: z.string() }))
    .query(async ({ ctx: { db, session }, input: { sentenceId } }) => {
      const [sentence] = await db
        .select()
        .from(sentences)
        .where(eq(sentences.id, sentenceId));

      if (!sentence) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sentence not found!",
        });
      }

      await getTrainingSessionOrThrow(sentence.trainingSessionId, db, session);

      return sentence;
    }),
  generateSentences: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.string(),
        limit: z.number().min(1).max(10).default(5),
        promptTemplate: z.string(),
      }),
    )
    .mutation(async ({ ctx: { db, session }, input }) => {
      const userSettings = await getUserSettings(session.user.id, db);
      if (!userSettings.nativeLanguage) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User do not have native language",
        });
      }

      const [nativeLanguage] = await db
        .select()
        .from(languages)
        .where(eq(languages.code, userSettings.nativeLanguage));
      if (!nativeLanguage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Native language not found!",
        });
      }

      const trainingSession = await getTrainingSessionOrThrow(
        input.trainingSessionId,
        db,
        session,
      );
      const [practiceLanguage] = await db
        .select()
        .from(languages)
        .where(eq(languages.code, trainingSession.languageCode));
      if (!practiceLanguage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Practice Language not found!",
        });
      }

      const practiceWords = await getCurrentPracticeWords({
        db,
        languageCode: practiceLanguage.code,
        session,
      });

      const knownWords = await db
        .select({ word: words.word })
        .from(userWords)
        .innerJoin(words, eq(words.id, userWords.wordId))
        .where(
          and(
            eq(userWords.userId, session.user.id),
            eq(words.languageCode, practiceLanguage.code),
            not(isNull(userWords.knownAt)),
          ),
        )
        .orderBy(desc(userWords.knownAt))
        .limit(50);

      const previouslyGeneratedSentences = await db
        .select({ index: sentences.index, sentence: sentences.sentence })
        .from(sentences)
        .where(eq(sentences.trainingSessionId, trainingSession.id))
        .orderBy(desc(sentences.index))
        .limit(30)
        .then((res) => res.reverse());

      const TEMPLATE_OBJECT = {
        SENTENCE_COUNT: input.limit,
        PRACTICE_LANGUAGE: practiceLanguage.name,
        NATIVE_LANGUAGE: nativeLanguage.name,
        PRACTICE_WORDS: practiceWords.map((word) => word.word).join(", "),
        KNOWN_WORDS: knownWords.map((word) => word.word).join(", "),
        COMPLEXITY: trainingSession.complexity,
        PREVIOUSLY_GENERATED_SENTENCES: previouslyGeneratedSentences
          .map((sen) => `${sen.index}. ${sen.sentence}`)
          .join("\n"),
      };

      const prompt = stringTemplate(input.promptTemplate, TEMPLATE_OBJECT);

      console.log("PROMPT: ", prompt);

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
        model: openai("gpt-4o", { user: session.user.id }),
        prompt,
        schema,
      });

      const validatedSentences = result.object.sentences;

      const lastSentenceIndex = previouslyGeneratedSentences.at(-1)?.index ?? 0;
      console.log("Last sentence index: ", lastSentenceIndex);

      const newSentences = await db
        .insert(sentences)
        .values(
          validatedSentences.map((sentence, index) => ({
            index: lastSentenceIndex + 1 + index,
            sentence: sentence.sentence,
            translation: sentence.translation,
            trainingSessionId: trainingSession.id,
          })),
        )
        .returning();

      return newSentences.sort((a, b) => a.index - b.index);
    }),
  getSentenceWords: protectedProcedure
    .input(z.object({ sentenceId: z.string(), promptTemplate: z.string() }))
    .output(
      z.array(
        createSelectSchema(sentenceWords, {
          interlinearLines: z.object({}).catchall(z.string()),
        }).extend({
          userWord: createSelectSchema(userWords).nullable(),
          word: createSelectSchema(words),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      const list = await db
        .select()
        .from(sentenceWords)
        .innerJoin(words, eq(words.id, sentenceWords.wordId))
        .leftJoin(userWords, eq(userWords.wordId, sentenceWords.wordId))
        .where(eq(sentenceWords.sentenceId, input.sentenceId))
        .orderBy(asc(sentenceWords.index));

      if (list.length > 0) {
        return list.map((item) => ({
          ...item.sentence_word,
          userWord: item.user_word,
          word: item.word,
        }));
      }

      const [sentence] = await db
        .select()
        .from(sentences)
        .where(eq(sentences.id, input.sentenceId));
      if (!sentence) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sentence not found!",
        });
      }

      const userSettings = await getUserSettings(ctx.session.user.id, db);
      if (!userSettings.nativeLanguage) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User do not have native language",
        });
      }

      const [nativeLanguage] = await db
        .select()
        .from(languages)
        .where(eq(languages.code, userSettings.nativeLanguage));
      if (!nativeLanguage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Native language not found!",
        });
      }

      const trainingSession = await getTrainingSessionOrThrow(
        sentence.trainingSessionId,
        ctx.db,
        ctx.session,
      );
      const [practiceLanguage] = await db
        .select()
        .from(languages)
        .where(eq(languages.code, trainingSession.languageCode));
      if (!practiceLanguage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Practice Language not found!",
        });
      }

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

      const filterdWords = (
        result.object.words as unknown as {
          word: string;
          lemma: string;
          text: string;
          [x: string]: string;
        }[]
      ).filter((word) => new RegExp(/\w+/).test(word.lemma));

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
            .from(userWords)
            .where(
              and(
                eq(userWords.userId, ctx.session.user.id),
                eq(userWords.wordId, word.id),
              ),
            );

          const [sentenceWord] = await db
            .insert(sentenceWords)
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

const buildSentenceWordsGPTSchema = ({
  nativeLanguage,
  practiceLanguage,
  userSettings,
}: {
  userSettings: UserSettings;
  nativeLanguage: Language;
  practiceLanguage: Language;
}) => {
  const wordSchema: Record<string, ZodString> = {};
  userSettings.interlinearLines.forEach((line) => {
    if (line.name && line.description) {
      wordSchema[line.name] = z.string().describe(
        stringTemplate(line.description, {
          PRACTICE_LANGUAGE: practiceLanguage.name,
          NATIVE_LANGUAGE: nativeLanguage.name,
        }),
      );
    }
  });

  return z.object({
    words: z.array(z.object(wordSchema)),
  });
};
