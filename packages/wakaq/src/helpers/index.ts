import type { Language } from "@acme/db/schema";
import { and, eq, inArray } from "@acme/db";
import { db } from "@acme/db/client";
import {
  languagesTable,
  userSettingsTable,
  userWordsTable,
  wordsTable,
} from "@acme/db/schema";

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
  const values = words
    .filter((word) => !existingWords.find((item) => item.word === word))
    .map(
      (word) =>
        ({
          languageCode,
          word,
        }) satisfies typeof wordsTable.$inferInsert,
    );

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
