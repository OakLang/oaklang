import { openai } from "@ai-sdk/openai";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import { z } from "zod";

import type { DB } from "@acme/db/client";
import type { TrainingSession } from "@acme/db/schema";
import { asc, desc, eq } from "@acme/db";
import { languages, sentences, words } from "@acme/db/schema";
import { generateSentenceObjectSchema } from "@acme/validators";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getTrainingSessionOrThrow } from "../utils";

export const sentencesRouter = createTRPCRouter({
  getSentences: protectedProcedure
    .input(z.object({ trainingSessionId: z.string() }))
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
      return sentencesList;
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
    .mutation(
      async ({
        ctx: { db, session },
        input: { trainingSessionId, promptTemplate },
      }) => {
        const trainingSession = await getTrainingSessionOrThrow(
          trainingSessionId,
          db,
          session,
        );
        const prompt = await buildPrompt(trainingSession, db, promptTemplate);
        console.log(prompt);
        const result = await generateObject({
          model: openai("gpt-4o", { user: session.user.id }),
          prompt,
          schema: generateSentenceObjectSchema,
        });
        const [lastSentence] = await db
          .select({ index: sentences.index })
          .from(sentences)
          .where(eq(sentences.trainingSessionId, trainingSession.id))
          .orderBy(desc(sentences.index));
        const values = result.object.sentences.map<
          typeof sentences.$inferInsert
        >((sentence, index) => ({
          sentence: sentence.sentence,
          translation: sentence.translation,
          words: sentence.words,
          trainingSessionId: trainingSession.id,
          index: (lastSentence?.index ?? 0) + 1 + index,
        }));
        if (values.length) {
          const newSentences = await db
            .insert(sentences)
            .values(values)
            .onConflictDoNothing()
            .returning();
          return newSentences;
        }
        return [];
      },
    ),
});

// const PROMPT = `You are a {{PRACTICE_LANGUAGE}} tutor providing carefully constructed sentences to a student designed to help them practice the new vocabulary and grammar they are learning and exercise already known vocabulary and grammar. You thoughtfully construct sentences, stories, dialogues, and exercises that use your language naturally while using known vocabulary.

// Please provide a series of {{SENTENCE_COUNT}} sentences suitable for an {{COMPLEXITY}} {{PRACTICE_LANGUAGE}} student using as many words from the {{PRACTICE_VOCABS}} list as possible and restricting other words to those in the {{KNOWN_VOCABS}} list. Also make sure not to regenerate previously generated sentences.

// PRACTICE LANGUAGE: "{{PRACTICE_LANGUAGE}}"

// HELP LANGUAGE: "{{HELP_LANGUAGE}}"

// PRACTICE VOCABS: "{{PRACTICE_VOCABS}}"

// KNOWN VOCABS: "{{KNOWN_VOCABS}}"

// PREVIOUSLY GENERATED SENTENCES: """
// {{PREVIOUSLY_GENERATED_SENTENCES}}
// """
// `;

const buildPrompt = async (
  trainingSession: TrainingSession,
  db: DB,
  promptTemplate: string,
) => {
  const sentencesList = await db
    .select({ sentence: sentences.sentence, index: sentences.index })
    .from(sentences)
    .where(eq(sentences.trainingSessionId, trainingSession.id))
    .orderBy(asc(sentences.index));

  const [helpLanguage] = await db
    .select()
    .from(languages)
    .where(eq(languages.code, trainingSession.helpLanguage));
  if (!helpLanguage) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Invalid Help Language!",
    });
  }

  const [practiceLanguage] = await db
    .select()
    .from(languages)
    .where(eq(languages.code, trainingSession.practiceLanguage));
  if (!practiceLanguage) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Invalid Practice Language!",
    });
  }

  const allWords = await db
    .select()
    .from(words)
    .where(eq(words.trainingSessionId, trainingSession.id))
    .orderBy(asc(words.createdAt));
  const practiceVocabs = allWords.map((word) => word.word).join(", ");
  const knownVocabs = allWords
    .filter((word) => word.isKnown)
    .map((word) => word.word)
    .join(", ");

  return promptTemplate
    .replaceAll("{{SENTENCE_COUNT}}", String(trainingSession.sentencesCount))
    .replaceAll("{{PRACTICE_LANGUAGE}}", practiceLanguage.name)
    .replaceAll("{{HELP_LANGUAGE}}", helpLanguage.name)
    .replaceAll("{{PRACTICE_VOCABS}}", practiceVocabs)
    .replaceAll("{{KNOWN_VOCABS}}", knownVocabs)
    .replaceAll("{{COMPLEXITY}}", trainingSession.complexity)
    .replaceAll(
      "{{PREVIOUSLY_GENERATED_SENTENCES}}",
      sentencesList
        .map((sentence) => `${sentence.index}. ${sentence.sentence}`)
        .join("\n"),
    );
};
