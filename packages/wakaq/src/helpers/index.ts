import type { Prompts } from "@acme/core/validators";
import type { Language, TrainingSession } from "@acme/db/schema";
import { FINITE_EXERCISES } from "@acme/core/constants";
import { and, desc, eq, inArray } from "@acme/db";
import { db } from "@acme/db/client";
import {
  languagesTable,
  sentencesTable,
  trainingSessionsTable,
  userSettingsTable,
  usersTable,
  userWordsTable,
  wordsTable,
} from "@acme/db/schema";

import { generateInterlinearLineForSentence } from "../tasks/generateInterlinearLineForSentence";

export async function getNativeLanguage(userId: string): Promise<Language> {
  const userSettingsResult = await db
    .select({
      nativeLanguage: languagesTable,
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

export async function getUserSettingsPrompts(userId: string): Promise<Prompts> {
  const userSettingsResult = await db
    .select({
      prompts: userSettingsTable.prompts,
    })
    .from(userSettingsTable)
    .where(eq(userSettingsTable.userId, userId));
  const prompts = userSettingsResult[0]?.prompts;
  if (!prompts) {
    throw new Error(`prompts not found for user ${userId}`);
  }
  return prompts;
}

export async function getOrThrowTrainingSession(trainingSessionId: string) {
  const [trainingSession] = await db
    .select({
      id: trainingSessionsTable.id,
      exercise: trainingSessionsTable.exercise,
      data: trainingSessionsTable.data,
      status: trainingSessionsTable.status,
      languageCode: languagesTable.code,
      language: languagesTable,
      userId: usersTable.id,
      userEmail: usersTable.email,
      userRole: usersTable.role,
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
  return trainingSession;
}

export async function updateTrainingSessionStatus(
  trainingSessionId: string,
  status: TrainingSession["status"],
) {
  await db
    .update(trainingSessionsTable)
    .set({
      status,
    })
    .where(eq(trainingSessionsTable.id, trainingSessionId));
}

export async function handleCreateSentences(
  trainingSession: {
    id: string;
    exercise: string;
  },
  generatedSentences: { sentence: string; translation: string }[],
) {
  let startIndex = 0;

  if (FINITE_EXERCISES.includes(trainingSession.exercise)) {
    await db
      .delete(sentencesTable)
      .where(eq(sentencesTable.trainingSessionId, trainingSession.id));
  } else {
    const [lastSentence] = await db
      .select()
      .from(sentencesTable)
      .where(eq(sentencesTable.trainingSessionId, trainingSession.id))
      .orderBy(desc(sentencesTable.index))
      .limit(1);
    if (lastSentence) {
      startIndex = lastSentence.index + 1;
    }
  }

  const values = generatedSentences.map(
    (sentence, index) =>
      ({
        sentence: sentence.sentence,
        translation: sentence.translation,
        trainingSessionId: trainingSession.id,
        index: startIndex + index,
      }) satisfies typeof sentencesTable.$inferInsert,
  );

  if (values.length > 0) {
    const sentences = await db
      .insert(sentencesTable)
      .values(values)
      .returning({ id: sentencesTable.id });
    await Promise.all(
      sentences.map((sentence) =>
        generateInterlinearLineForSentence.enqueue({
          sentenceId: sentence.id,
        }),
      ),
    );
  }
}

export async function getInterlinearLines(userId: string) {
  const [userSettings] = await db
    .select({
      interlinearLines: userSettingsTable.interlinearLines,
    })
    .from(userSettingsTable)
    .leftJoin(
      languagesTable,
      eq(languagesTable.code, userSettingsTable.nativeLanguage),
    )
    .where(eq(userSettingsTable.userId, userId));

  if (!userSettings) {
    throw new Error("userSettings not found!");
  }
  return userSettings.interlinearLines;
}

export const getOrCreateWords = async (
  words: string[],
  languageCode: string,
) => {
  const existingWords = await db
    .select()
    .from(wordsTable)
    .where(
      and(
        eq(wordsTable.languageCode, languageCode),
        inArray(wordsTable.word, words),
      ),
    );
  const values = [
    ...new Set(
      words
        .filter((word) => !existingWords.find((item) => item.word === word))
        .map(
          (word) =>
            ({
              languageCode,
              word,
            }) satisfies typeof wordsTable.$inferInsert,
        ),
    ),
  ];

  if (values.length > 0) {
    const newWords = await db.insert(wordsTable).values(values).returning();
    return [...existingWords, ...newWords];
  }
  return existingWords;
};

export const insertUserWords = async (
  words: { id: string }[],
  userId: string,
) => {
  await db
    .insert(userWordsTable)
    .values(
      words.map((word) => ({
        userId,
        wordId: word.id,
      })),
    )
    .onConflictDoNothing();
};
