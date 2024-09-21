import type { ZodString } from "zod";
import { openai } from "@ai-sdk/openai";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import { z } from "zod";

import type { InterlinearLine } from "@acme/core/validators";
import type { DB } from "@acme/db/client";
import type { TrainingSession, UserSettings } from "@acme/db/schema";
import { asc, desc, eq } from "@acme/db";
import { languages, sentences } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  getInterlinearLines,
  getTrainingSessionOrThrow,
  getUserSettings,
} from "../utils";

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
        const userSettings = await getUserSettings(session.user.id, db);

        const prompt = await buildPrompt(
          trainingSession,
          userSettings,
          db,
          promptTemplate,
        );

        const interlinearLines = await getInterlinearLines(session.user.id, db);

        const result = await generateObject({
          model: openai("gpt-4o", { user: session.user.id }),
          prompt,
          schema: buildSchema(interlinearLines),
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

const buildPrompt = async (
  trainingSession: TrainingSession,
  userSettings: UserSettings,
  db: DB,
  promptTemplate: string,
) => {
  const sentencesList = await db
    .select({ sentence: sentences.sentence, index: sentences.index })
    .from(sentences)
    .where(eq(sentences.trainingSessionId, trainingSession.id))
    .orderBy(asc(sentences.index));

  const [language] = await db
    .select()
    .from(languages)
    .where(eq(languages.code, trainingSession.languageCode));
  if (!language) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Invalid Help Language!",
    });
  }
  if (!userSettings.nativeLanguage) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Native language not found in user settings",
    });
  }
  const [nativeLanguage] = await db
    .select()
    .from(languages)
    .where(eq(languages.code, userSettings.nativeLanguage));
  if (!nativeLanguage) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Native language not found",
    });
  }

  // const knownWords = await db
  //   .select()
  //   .from(words)
  //   .where(
  //     and(eq(words.userId, trainingSession.userId), eq(words.isKnown, true)),
  //   )
  //   .orderBy(asc(words.createdAt));
  // const practicingWords = await db
  //   .select()
  //   .from(words)
  //   .where(
  //     and(
  //       eq(words.userId, trainingSession.userId),
  //       eq(words.isPracticing, true),
  //     ),
  //   )
  //   .orderBy(asc(words.createdAt));

  return (
    promptTemplate
      .replaceAll("{{SENTENCE_COUNT}}", "5")
      .replaceAll("{{PRACTICE_LANGUAGE}}", language.name)
      .replaceAll("{{NATIVE_LANGUAGE}}", nativeLanguage.name)
      // .replaceAll(
      //   "{{PRACTICE_VOCABS}}",
      //   practicingWords.map((i) => i.word).join(", "),
      // )
      // .replaceAll("{{KNOWN_VOCABS}}", knownWords.map((i) => i.word).join(", "))
      .replaceAll("{{COMPLEXITY}}", trainingSession.complexity)
      .replaceAll(
        "{{PREVIOUSLY_GENERATED_SENTENCES}}",
        sentencesList
          .map((sentence) => `${sentence.index}. ${sentence.sentence}`)
          .join("\n"),
      )
  );
};

const buildSchema = (interlinearLines: InterlinearLine[]) => {
  const wordSchemaObject: Record<string, ZodString> = {};
  interlinearLines.forEach((line) => {
    if (line.name && line.description) {
      wordSchemaObject[line.name] = z.string().describe(line.description);
    }
  });
  const wordSchema = z.object(wordSchemaObject);

  const sentenceSchema = z.object({
    sentence: z.string().describe(`the full sentence in PRACTICE LANGUAGE.`),
    translation: z
      .string()
      .describe(`the full sentence translation in HELP LANGUAGE`),
    words: z
      .array(wordSchema)
      .describe(`list of words to build the full sentence`),
  });

  const generateSentenceObjectSchema = z.object({
    sentences: z.array(sentenceSchema).describe("list of sentences"),
  });

  return generateSentenceObjectSchema;
};
