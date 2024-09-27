import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Session } from "@acme/auth";
import type { DB } from "@acme/db/client";
import type { UserSettings, Word } from "@acme/db/schema";
import {
  DEFAULT_INTERLINEAR_LINES,
  interlinearLine,
} from "@acme/core/validators";
import { and, count, desc, eq, isNull, lte, not, or, sql } from "@acme/db";
import {
  trainingSessions,
  userSettings,
  userWords,
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
    const lines = DEFAULT_INTERLINEAR_LINES;
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
    .from(userWords)
    .innerJoin(words, eq(words.id, userWords.wordId))
    .where(
      and(
        eq(userWords.userId, session.user.id),
        not(isNull(userWords.knownAt)),
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
    .from(userWords)
    .where(
      and(
        eq(userWords.userId, session.user.id),
        not(isNull(userWords.knownAt)),
      ),
    );
  return row?.count ?? 0;
};

export const getCurrentPracticeWords = async ({
  db,
  languageCode,
  session,
}: {
  db: DB;
  session: Session;
  languageCode: string;
}) => {
  return db
    .select({
      word: words.word,
      wordId: userWords.wordId,
      seenCount: userWords.seenCount,
      lastPracticedAt: userWords.lastPracticedAt,
      practiceCount: userWords.practiceCount,
      seenCountSinceLastPracticed: userWords.seenCountSinceLastPracticed,
      nextPracticeAt: userWords.nextPracticeAt,
      spacedRepetitionStage: userWords.spacedRepetitionStage,
      lastSeenAt: userWords.lastSeenAt,
      knownAt: userWords.knownAt,
    })
    .from(userWords)
    .innerJoin(words, eq(words.id, userWords.wordId))
    .where(
      and(
        eq(userWords.userId, session.user.id),
        eq(words.languageCode, languageCode),
        isNull(userWords.knownAt),
        or(
          isNull(userWords.nextPracticeAt),
          lte(userWords.nextPracticeAt, sql`NOW()`),
        ),
      ),
    )
    .orderBy(desc(userWords.seenCount))
    .limit(50);
};
