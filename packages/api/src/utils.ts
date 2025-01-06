import { TRPCError } from "@trpc/server";

import type { Session } from "@acme/auth";
import type { DB } from "@acme/db/client";
import type { Language, UserSettings } from "@acme/db/schema";
import { and, count, eq, inArray, isNull, not } from "@acme/db";
import {
  languagesTable,
  sentencesTable,
  trainingSessionsTable,
  userSettingsTable,
  userWordsTable,
  wordsTable,
} from "@acme/db/schema";

export interface ProtectedCtx {
  db: DB;
  session: Session;
}

export const getTrainingSessionOrThrow = async (
  trainingSessionId: string,
  db: DB,
  session: Session,
) => {
  const [trainingSession] = await db
    .select()
    .from(trainingSessionsTable)
    .where(eq(trainingSessionsTable.id, trainingSessionId));
  if (!trainingSession || trainingSession.userId !== session.user.id) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Training Session not found!",
    });
  }
  return trainingSession;
};

export const getUserSettings = async ({ db, session }: ProtectedCtx) => {
  const [settings] = await db
    .select()
    .from(userSettingsTable)
    .where(eq(userSettingsTable.userId, session.user.id));
  if (!settings) {
    const [newSettings] = await db
      .insert(userSettingsTable)
      .values({ userId: session.user.id })
      .returning();
    if (!newSettings) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create user settings",
      });
    }
    return newSettings;
  }
  return settings;
};

export const getNativeLanguageOrThrow = async (
  ctx: ProtectedCtx,
  settings?: UserSettings,
): Promise<Language> => {
  if (!settings) {
    settings = await getUserSettings(ctx);
  }

  if (!settings.nativeLanguage) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No native language found in user settings!",
    });
  }

  return getLanguageOrThrow(settings.nativeLanguage, ctx.db);
};

export const getKnownWordsCountForLanguage = async (
  languageCode: string,
  session: Session,
  db: DB,
): Promise<number> => {
  const [row] = await db
    .select({ count: count() })
    .from(userWordsTable)
    .innerJoin(wordsTable, eq(wordsTable.id, userWordsTable.wordId))
    .where(
      and(
        eq(userWordsTable.userId, session.user.id),
        not(isNull(userWordsTable.knownAt)),
        eq(wordsTable.languageCode, languageCode),
      ),
    );
  return row?.count ?? 0;
};

export const getLanguageOrThrow = async (languageCode: string, db: DB) => {
  const [language] = await db
    .select()
    .from(languagesTable)
    .where(eq(languagesTable.code, languageCode));
  if (!language) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `No language found with code ${languageCode}`,
    });
  }
  return language;
};

export const getSentenceOrThrow = async (
  sentenceId: string,
  ctx: ProtectedCtx,
) => {
  const [sentence] = await ctx.db
    .select()
    .from(sentencesTable)
    .where(eq(sentencesTable.id, sentenceId));

  if (!sentence) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Sentence not found!",
    });
  }

  return sentence;
};

export const getOrCreateWords = async (
  words: string[],
  languageCode: string,
  db: DB,
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
  db: DB,
) => {
  if (words.length === 0) {
    return;
  }
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
