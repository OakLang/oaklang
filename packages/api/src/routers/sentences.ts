import type { ZodString } from "zod";
import { openai } from "@ai-sdk/openai";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import { z } from "zod";

import type { Session } from "@acme/auth";
import type { DB } from "@acme/db/client";
import type { Language, TrainingSession, UserSettings } from "@acme/db/schema";
import { and, asc, desc, eq, isNull, not } from "@acme/db";
import {
  languages,
  practiceWords,
  sentences,
  sentenceWords,
  words,
} from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  getOrCreateWord,
  getTrainingSessionOrThrow,
  getUserSettings,
} from "../utils";
import { sentenceWithWords } from "../validators";

export const sentencesRouter = createTRPCRouter({
  getSentences: protectedProcedure
    .input(z.object({ trainingSessionId: z.string() }))
    .output(z.array(sentenceWithWords))
    .query(async ({ ctx: { db, session }, input: { trainingSessionId } }) => {
      const trainingSession = await getTrainingSessionOrThrow(
        trainingSessionId,
        db,
        session,
      );
      const sentencesList = await db
        .select()
        .from(sentences)
        .where(eq(sentences.trainingSessionId, trainingSession.id))
        .orderBy(asc(sentences.index));
      return Promise.all(
        sentencesList.map(async (sentence) => {
          const list = await db
            .select()
            .from(sentenceWords)
            .innerJoin(words, eq(words.id, sentenceWords.wordId))
            .where(eq(sentenceWords.sentenceId, sentence.id))
            .orderBy(asc(sentenceWords.index));

          return {
            ...sentence,
            sentenceWords: list.map((item) => ({
              ...item.sentence_word,
              word: item.word,
            })),
          };
        }),
      );
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
  generateMoreSentences: protectedProcedure
    .input(
      z.object({
        trainingSessionId: z.string(),
        promptTemplate: z.string().min(1).max(1000),
      }),
    )
    .output(z.array(sentenceWithWords))
    .mutation(
      async ({
        ctx: { db, session },
        input: { trainingSessionId, promptTemplate },
      }) => {
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
          trainingSessionId,
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

        const prompt = await buildPrompt({
          trainingSession,
          db,
          promptTemplate,
          nativeLanguage,
          practiceLanguage,
          session,
        });

        const schema = buildSchema({
          userSettings,
          nativeLanguage,
          practiceLanguage,
        });

        const result = await generateObject({
          model: openai("gpt-4o", { user: session.user.id }),
          prompt,
          schema,
        });

        const [lastSentence] = await db
          .select({ index: sentences.index })
          .from(sentences)
          .where(eq(sentences.trainingSessionId, trainingSession.id))
          .orderBy(desc(sentences.index));

        const value = await Promise.all(
          result.object.sentences.map(async (item, sentenceIndex) => {
            const [sentence] = await db
              .insert(sentences)
              .values({
                sentence: item.sentence,
                translation: item.translation,
                trainingSessionId: trainingSession.id,
                index: (lastSentence?.index ?? 0) + 1 + sentenceIndex,
              })
              .returning();
            if (!sentence) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create sentence",
              });
            }

            const sentenceWordsList = await Promise.all(
              item.words.map(async (wordRecord, wordIndex) => {
                const primaryWord = wordRecord.word;
                if (!primaryWord) {
                  throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to get primary word",
                  });
                }

                const word = await getOrCreateWord(
                  primaryWord,
                  trainingSession.languageCode,
                  db,
                );

                const [sentenceWord] = await db
                  .insert(sentenceWords)
                  .values({
                    sentenceId: sentence.id,
                    wordId: word.id,
                    index: wordIndex,
                    interlinearLines: wordRecord,
                  })
                  .returning();

                if (!sentenceWord) {
                  throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to connect sentence to word",
                  });
                }

                return {
                  ...sentenceWord,
                  word,
                };
              }),
            );

            return {
              ...sentence,
              sentenceWords: sentenceWordsList,
            };
          }),
        );

        return value;
      },
    ),
});

const buildPrompt = async ({
  db,
  nativeLanguage,
  practiceLanguage,
  promptTemplate,
  trainingSession,
  session,
}: {
  db: DB;
  session: Session;
  trainingSession: TrainingSession;
  promptTemplate: string;
  nativeLanguage: Language;
  practiceLanguage: Language;
}) => {
  if (promptTemplate.includes("{{KNOWN_WORDS}}")) {
    const knownWordsList = await db
      .select({ word: words.word })
      .from(practiceWords)
      .innerJoin(words, eq(words.id, practiceWords.wordId))
      .where(
        and(
          eq(practiceWords.userId, session.user.id),
          eq(words.languageCode, trainingSession.languageCode),
          not(isNull(practiceWords.knownAt)),
        ),
      )
      .orderBy(desc(practiceWords.knownAt))
      .limit(40);

    promptTemplate = promptTemplate.replaceAll(
      "{{KNOWN_WORDS}}",
      knownWordsList.map((word) => word.word).join(", "),
    );
  }

  if (promptTemplate.includes("{{PRACTICE_WORDS}}")) {
    const practiceWordsList = await db
      .select({ word: words.word })
      .from(practiceWords)
      .innerJoin(words, eq(words.id, practiceWords.wordId))
      .where(
        and(
          eq(practiceWords.userId, session.user.id),
          eq(words.languageCode, trainingSession.languageCode),
          isNull(practiceWords.knownAt),
        ),
      )
      .orderBy(desc(practiceWords.practiceCount))
      .limit(40);

    promptTemplate = promptTemplate.replaceAll(
      "{{PRACTICE_WORDS}}",
      practiceWordsList.map((word) => word.word).join(", "),
    );
  }

  if (promptTemplate.includes("{{PREVIOUSLY_GENERATED_SENTENCES}}")) {
    const sentencesList = await db
      .select({ sentence: sentences.sentence, index: sentences.index })
      .from(sentences)
      .where(eq(sentences.trainingSessionId, trainingSession.id))
      .orderBy(asc(sentences.index));

    promptTemplate = promptTemplate.replaceAll(
      "{{PREVIOUSLY_GENERATED_SENTENCES}}",
      sentencesList
        .map((sentence) => `${sentence.index}. ${sentence.sentence}`)
        .join("\n"),
    );
  }

  return promptTemplate
    .replaceAll("{{SENTENCE_COUNT}}", "5")
    .replaceAll("{{PRACTICE_LANGUAGE}}", practiceLanguage.name)
    .replaceAll("{{NATIVE_LANGUAGE}}", nativeLanguage.name)
    .replaceAll("{{COMPLEXITY}}", trainingSession.complexity);
};

const buildSchema = ({
  nativeLanguage,
  practiceLanguage,
  userSettings,
}: {
  userSettings: UserSettings;
  nativeLanguage: Language;
  practiceLanguage: Language;
}) => {
  const wordSchemaObject: Record<string, ZodString> = {};
  userSettings.interlinearLines.forEach((line) => {
    if (line.name && line.description) {
      wordSchemaObject[line.name] = z
        .string()
        .describe(
          line.description
            .replaceAll("{{PRACTICE_LANGUAGE}}", practiceLanguage.name)
            .replaceAll("{{NATIVE_LANGUAGE}}", nativeLanguage.name),
        );
    }
  });
  const wordSchema = z.object(wordSchemaObject);

  const sentenceSchema = z.object({
    sentence: z
      .string()
      .describe(`the full sentence in ${practiceLanguage.name}.`),
    translation: z
      .string()
      .describe(`the full sentence translation in ${nativeLanguage.name}`),
    words: z
      .array(wordSchema)
      .describe(`list of words to build the full sentence`),
  });

  const generateSentenceObjectSchema = z.object({
    sentences: z.array(sentenceSchema).describe("list of sentences"),
  });

  return generateSentenceObjectSchema;
};
