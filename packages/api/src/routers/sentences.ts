// import type { ZodString } from "zod";
import type { ZodString } from "zod";
import { openai } from "@ai-sdk/openai";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import stringTemplate from "string-template";
import { z } from "zod";

import type { Language, UserSettings } from "@acme/db/schema";
// import type { Session } from "@acme/auth";
// import type { DB } from "@acme/db/client";
// import type { Language, TrainingSession, UserSettings } from "@acme/db/schema";
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

      console.log(
        "PRACTICE WORDS: ",
        practiceWords.map((word) => word.word).join(", "),
      );

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

      console.log(
        "KNOWN WORDS: ",
        knownWords.map((word) => word.word).join(", "),
      );

      const previouslyGeneratedSentences = await db
        .select({ index: sentences.index, sentence: sentences.sentence })
        .from(sentences)
        .where(eq(sentences.trainingSessionId, trainingSession.id))
        .orderBy(desc(sentences.index))
        .limit(30)
        .then((res) => res.reverse());

      console.log(
        "PREVIOUSLY GENERATED SENTENCES: ",
        previouslyGeneratedSentences
          .map((sen) => `${sen.index}. ${sen.sentence}`)
          .join("\n"),
      );
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
    .query(async ({ ctx, input }) => {
      const list = await db
        .select()
        .from(sentenceWords)
        .where(eq(sentenceWords.sentenceId, input.sentenceId))
        .orderBy(asc(sentenceWords.index));

      if (list.length > 0) {
        return list;
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

      const values = await Promise.all(
        result.object.words.map(async (item, index) => {
          const primaryWord = item.word;
          if (!primaryWord) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "No primary interlinear line found!",
            });
          }
          const word = await getOrCreateWord(
            primaryWord,
            practiceLanguage.code,
            db,
          );
          return {
            interlinearLines: item,
            index,
            sentenceId: sentence.id,
            wordId: word.id,
          } satisfies typeof sentenceWords.$inferInsert;
        }),
      );

      if (values.length > 0) {
        return db.insert(sentenceWords).values(values).returning();
      }
      return [];
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
