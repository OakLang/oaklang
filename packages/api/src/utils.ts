import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Session } from "@acme/auth";
import type { InterlinearLine } from "@acme/core/validators";
import type { DB } from "@acme/db/client";
import type { UserSettings, Word } from "@acme/db/schema";
import { interlinearLine } from "@acme/core/validators";
import {
  and,
  count,
  eq,
  getDefaultInterlinearLines,
  isNull,
  not,
  sql,
} from "@acme/db";
import {
  practiceWords,
  trainingSessions,
  userSettings,
  words,
} from "@acme/db/schema";

export const getTrainingSessionOrThrow = async (
  trainingSessionId: string,
  db: DB,
  session: Session,
) => {
  const [trainingSession] = await db
    .select()
    .from(trainingSessions)
    .where(eq(trainingSessions.id, trainingSessionId));
  if (!trainingSession || trainingSession.userId !== session.user.id) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Training Session not found!",
    });
  }
  return trainingSession;
};

export const getUserSettings = async (userId: string, db: DB) => {
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));
  if (!settings) {
    const [newSettings] = await db
      .insert(userSettings)
      .values({ userId })
      .returning();
    if (!newSettings) {
      throw new Error("Failed to create user settings");
    }
    return newSettings;
  }
  return settings;
};

export const getInterlinearLines = async (
  userId: string,
  db: DB,
  settings?: UserSettings,
) => {
  if (!settings) {
    settings = await getUserSettings(userId, db);
  }
  try {
    const interlinearLines = await z
      .array(interlinearLine)
      .min(1)
      .parseAsync(settings.interlinearLines);
    return interlinearLines;
  } catch (error) {
    const lines = (userSettings.interlinearLines.defaultFn?.() ??
      getDefaultInterlinearLines()) as unknown as InterlinearLine[];
    await db.update(userSettings).set({
      interlinearLines: lines,
    });
    return lines;
  }
};

export const getOrCreateWord = async (
  word: string,
  langaugeCode: string,
  db: DB,
): Promise<Word> => {
  const cleanWord = word.trim().toLowerCase();

  const [newWord] = await db
    .insert(words)
    .values({
      word: cleanWord,
      languageCode: langaugeCode,
    })
    .onConflictDoUpdate({
      target: [words.word, words.languageCode],
      set: {
        word: sql`${words.word}`,
        languageCode: sql`${words.languageCode}`,
      },
    })
    .returning();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return newWord!;
};

export const getKnownWordsCountForLanguage = async (
  languageCode: string,
  session: Session,
  db: DB,
): Promise<number> => {
  const [row] = await db
    .select({ count: count() })
    .from(practiceWords)
    .innerJoin(words, eq(words.id, practiceWords.wordId))
    .where(
      and(
        eq(practiceWords.userId, session.user.id),
        not(isNull(practiceWords.knownAt)),
        eq(words.languageCode, languageCode),
      ),
    );
  return row?.count ?? 0;
};

export const getKnownWordsCount = async (
  session: Session,
  db: DB,
): Promise<number> => {
  const [row] = await db
    .select({ count: count() })
    .from(practiceWords)
    .where(
      and(
        eq(practiceWords.userId, session.user.id),
        not(isNull(practiceWords.knownAt)),
      ),
    );
  return row?.count ?? 0;
};
