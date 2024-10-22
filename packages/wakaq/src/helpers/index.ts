import type { Language } from "@acme/db/schema";
import { eq, sql } from "@acme/db";
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

export const getOrCreateWords = async (
  words: string[],
  languageCode: string,
) => {
  return db
    .insert(wordsTable)
    .values(
      words.map((word) => ({
        word,
        languageCode,
      })),
    )
    .onConflictDoUpdate({
      target: [wordsTable.word, wordsTable.languageCode],
      set: {
        word: sql`${wordsTable.word}`,
        languageCode: sql`${wordsTable.languageCode}`,
      },
    })
    .returning();
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
