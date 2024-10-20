import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import stringTemplate from "string-template";
import { z } from "zod";

import { EXERCISE_2, Exercises } from "@acme/core/constants";
import { eq } from "@acme/db";
import { db } from "@acme/db/client";
import {
  aiUsageTable,
  languagesTable,
  sentencesTable,
  trainingSessionsTable,
  userSettingsTable,
  usersTable,
} from "@acme/db/schema";
import { exercise2Data } from "@acme/db/validators";

import { wakaq } from "..";

async function getNativeLanguage(userId: string): Promise<string> {
  const userSettingsResult = await db
    .select({
      nativeLanguage: languagesTable.name,
    })
    .from(userSettingsTable)
    .leftJoin(
      languagesTable,
      eq(languagesTable.code, userSettingsTable.nativeLanguage),
    )
    .where(eq(userSettingsTable.userId, userId));

  const nativeLanguage = userSettingsResult[0]?.nativeLanguage;
  if (!nativeLanguage) {
    throw new Error("nativeLanguage not found in userSettings");
  }
  return nativeLanguage;
}

async function generateSentences(
  prompt: string,
  practiceLanguage: string,
  nativeLanguage: string,
  userId: string,
  userEmail: string,
): Promise<{ sentence: string; translation: string }[]> {
  const schema = z.object({
    sentences: z.array(
      z.object({
        sentence: z
          .string()
          .describe(`The full sentence in ${practiceLanguage} language.`),
        translation: z
          .string()
          .describe(
            `The full sentence translation in ${nativeLanguage} language.`,
          ),
      }),
    ),
  });

  const result = await generateObject({
    model: openai("gpt-4o"),
    schema,
    prompt,
  });

  await db.insert(aiUsageTable).values({
    platform: "openai",
    model: "gpt-4o",
    generationType: "object",
    prompt,
    result,
    tokenCount: result.usage.totalTokens,
    userId,
    userEmail,
    metadata: {
      functionName: "generateSentences",
      functionArgs: {
        prompt,
        practiceLanguage,
        nativeLanguage,
        userId,
        userEmail,
      },
      functionReturn: result.object.sentences,
      zodSchema: schema,
    },
  });

  return result.object.sentences;
}

export const generateSentencesForExercise2 = wakaq.task(
  async (args) => {
    const { trainingSessionId } = await z
      .object({
        trainingSessionId: z.string(),
      })
      .parseAsync(args);

    console.log("Running Task: generateSentencesForExercise2", {
      trainingSessionId,
    });

    const [trainingSession] = await db
      .select({
        id: trainingSessionsTable.id,
        exercise: trainingSessionsTable.exercise,
        data: trainingSessionsTable.data,
        status: trainingSessionsTable.status,
        languageCode: languagesTable.code,
        language: languagesTable.name,
        userId: usersTable.id,
        userEmail: usersTable.email,
      })
      .from(trainingSessionsTable)
      .innerJoin(
        languagesTable,
        eq(languagesTable.code, trainingSessionsTable.languageCode),
      )
      .innerJoin(usersTable, eq(usersTable.id, trainingSessionsTable.userId))
      .where(eq(trainingSessionsTable.id, trainingSessionId));
    if (!trainingSession) {
      throw new Error("trainingSession not found!");
    }

    if (trainingSession.exercise !== Exercises.exercise2) {
      throw new Error("Training session is not for exercise 2");
    }

    if (trainingSession.status === "pending") {
      throw new Error("Already Pending!");
    }

    if (trainingSession.status === "success") {
      throw new Error("Already success!");
    }

    const practiceLanguage = trainingSession.language;
    const data = await exercise2Data.parseAsync(trainingSession.data);
    const nativeLanguage = await getNativeLanguage(trainingSession.userId);

    let generatedSentences: { sentence: string; translation: string }[] = [];

    await db
      .update(trainingSessionsTable)
      .set({
        status: "pending",
      })
      .where(eq(trainingSessionsTable.id, trainingSession.id));

    try {
      switch (data.learnFrom) {
        case "list-of-words": {
          const prompt = stringTemplate(
            EXERCISE_2.promptTemplates.listOfWords,
            {
              PRACTICE_LANGUAGE: practiceLanguage,
              NATIVE_LANGUAGE: nativeLanguage,
              COMPLEXITY: data.complexity,
              WORDS: data.words.join(", "),
              EACH_WORD_PRACTICE_COUNT: data.eachWordPracticeCount,
            },
          );
          generatedSentences = await generateSentences(
            prompt,
            nativeLanguage,
            practiceLanguage,
            trainingSession.userId,
            trainingSession.userEmail,
          );
          break;
        }
        case "number-of-words": {
          const prompt = stringTemplate(
            EXERCISE_2.promptTemplates.numberOfWords,
            {
              PRACTICE_LANGUAGE: practiceLanguage,
              NATIVE_LANGUAGE: nativeLanguage,
              COMPLEXITY: data.complexity,
              NUMBER_OF_WORDS: data.numberOfWords,
              EACH_WORD_PRACTICE_COUNT: data.eachWordPracticeCount,
              TOPIC: data.topic,
            },
          );
          generatedSentences = await generateSentences(
            prompt,
            nativeLanguage,
            practiceLanguage,
            trainingSession.userId,
            trainingSession.userEmail,
          );
          break;
        }
        case "number-of-sentences": {
          const prompt = stringTemplate(
            EXERCISE_2.promptTemplates.numberOfSentences,
            {
              PRACTICE_LANGUAGE: practiceLanguage,
              NATIVE_LANGUAGE: nativeLanguage,
              COMPLEXITY: data.complexity,
              NUMBER_OF_SENTENCES: data.numberOfSentences,
              TOPIC: data.topic,
            },
          );
          generatedSentences = await generateSentences(
            prompt,
            nativeLanguage,
            practiceLanguage,
            trainingSession.userId,
            trainingSession.userEmail,
          );
          break;
        }
      }

      console.log({ generatedSentences });

      const values = generatedSentences.map(
        (sentence, index) =>
          ({
            sentence: sentence.sentence,
            translation: sentence.translation,
            trainingSessionId,
            index,
          }) satisfies typeof sentencesTable.$inferInsert,
      );

      if (values.length > 0) {
        await db.insert(sentencesTable).values(values);
      }

      await db
        .update(trainingSessionsTable)
        .set({
          status: "success",
        })
        .where(eq(trainingSessionsTable.id, trainingSession.id));
    } catch (error) {
      await db
        .update(trainingSessionsTable)
        .set({
          status: "error",
        })
        .where(eq(trainingSessionsTable.id, trainingSession.id));
    }
  },
  { name: "generateSentencesForExercise2" },
);
