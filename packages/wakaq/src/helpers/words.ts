import type { Language } from "@acme/db/schema";
import { and, desc, eq, isNull, lte, or, sql } from "@acme/db";
import { db } from "@acme/db/client";
import { userWordsTable, wordsTable } from "@acme/db/schema";

import { getMoreWords, pickReleventWordsForATopic } from "./ai";

export async function getPracticeWordsList({
  wordCount,
  practiceLanguage,
  knownWords,
  topic,
  userId,
  userEmail,
}: {
  wordCount: number;
  practiceLanguage: Language;
  knownWords: string[];
  topic?: string;
  userId: string;
  userEmail: string;
}): Promise<string[]> {
  const currentPracticeWordsList = await db
    .select({ word: wordsTable.word })
    .from(userWordsTable)
    .innerJoin(wordsTable, eq(wordsTable.id, userWordsTable.wordId))
    .where(
      and(
        eq(userWordsTable.userId, userId),
        eq(wordsTable.languageCode, practiceLanguage.code),
        isNull(userWordsTable.knownAt),
        or(
          isNull(userWordsTable.nextPracticeAt),
          lte(userWordsTable.nextPracticeAt, sql`NOW()`),
        ),
      ),
    )
    .orderBy(desc(userWordsTable.seenCount));

  let practiceWordsList: string[] = [];

  if (topic && currentPracticeWordsList.length > 0) {
    practiceWordsList = await pickReleventWordsForATopic({
      topic,
      wordCount: wordCount,
      words: currentPracticeWordsList.map((word) => word.word),
      userId,
      userEmail,
    });
  } else {
    practiceWordsList = currentPracticeWordsList
      .map((word) => word.word)
      .slice(0, wordCount);
  }

  if (practiceWordsList.length < wordCount) {
    const newWords = await getMoreWords({
      wordCount: wordCount - practiceWordsList.length,
      practiceLanguage: practiceLanguage,
      topic: topic?.trim(),
      currentWords: [...practiceWordsList, ...knownWords],
      userId,
      userEmail,
    });

    practiceWordsList = [...new Set([...practiceWordsList, ...newWords])];
  }

  return practiceWordsList;
}
