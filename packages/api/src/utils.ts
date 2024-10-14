import { TRPCError } from "@trpc/server";

import type { Session } from "@acme/auth";
import type { DB } from "@acme/db/client";
import type { Language, UserSettings, Word } from "@acme/db/schema";
import { and, count, eq, isNull, not, sql } from "@acme/db";
import {
  languagesTable,
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

export const getOrCreateWord = async (
  word: string,
  langaugeCode: string,
  db: DB,
): Promise<Word> => {
  const [newWord] = await db
    .insert(wordsTable)
    .values({
      word: word.trim().toLowerCase(),
      languageCode: langaugeCode,
    })
    .onConflictDoUpdate({
      target: [wordsTable.word, wordsTable.languageCode],
      set: {
        word: sql`${wordsTable.word}`,
        languageCode: sql`${wordsTable.languageCode}`,
      },
    })
    .returning();
  if (!newWord) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  }
  return newWord;
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
