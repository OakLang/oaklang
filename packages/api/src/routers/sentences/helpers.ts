import type { ZodString } from "zod";
import { openai } from "@ai-sdk/openai";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import stringTemplate from "string-template";
import { z } from "zod";

import type { Language, TrainingSession, UserSettings } from "@acme/db/schema";
import { and, desc, eq, isNull, lte, or, sql } from "@acme/db";
import {
  sentences,
  trainingSessionWords,
  userWords,
  words,
} from "@acme/db/schema";

import type { ProtectedCtx } from "../../utils";
import { getOrCreateWord } from "../../utils";

const getMoreWordsPrompt = ({
  practiceLanguage,
  wordCount,
  topic,
  currentWords,
}: {
  topic?: string;
  wordCount: number;
  practiceLanguage: string;
  currentWords: string[];
}) => {
  return stringTemplate(
    topic
      ? "Give me a list of {WORD_COUNT} common words from {PRACTICE_LANGUAGE} language in lemma form related to the topic below. Also do not provide any word from the CURRENT WORDS list.\n\nTOPIC: {TOPIC}\nCURRENT WORDS: {CURRENT_WORDS}"
      : "Give me a list of {WORD_COUNT} common words from {PRACTICE_LANGUAGE} language in lemma form..  Also do not provide any word from the CURRENT WORDS list.\nCURRENT WORDS: {CURRENT_WORDS}",
    {
      WORD_COUNT: wordCount,
      PRACTICE_LANGUAGE: practiceLanguage,
      TOPIC: topic,
      CURRENT_WORDS: currentWords.join(", "),
    },
  );
};

const pickReleventWordsForATopic = ({
  topic,
  words,
  wordCount,
}: {
  topic: string;
  words: string[];
  wordCount: number;
}) => {
  return stringTemplate(
    "Pick maximum {WORD_COUNT} words form the WORDS list below which are related to the TOPIC. Do not pick any other words which are not in the WORDS list below.\n\nWORDS: {WORDS}\n\nTOPIC: {TOPIC}",
    {
      WORDS: words.join(", "),
      TOPIC: topic,
      WORD_COUNT: wordCount,
    },
  );
};

export const buildSentenceWordsGPTSchema = ({
  nativeLanguage,
  practiceLanguage,
  userSettings,
}: {
  userSettings: UserSettings;
  nativeLanguage: Language;
  practiceLanguage: Language;
}) => {
  const wordSchema: Record<string, ZodString> = {};
  userSettings.interlinearLines.forEach((line) => {
    if (line.name && line.description) {
      wordSchema[line.name] = z.string().describe(
        stringTemplate(line.description, {
          PRACTICE_LANGUAGE: practiceLanguage.name,
          NATIVE_LANGUAGE: nativeLanguage.name,
        }),
      );
    }
  });

  return z.object({
    words: z.array(z.object(wordSchema)),
  });
};

export const getPracticeWordsList = async (
  {
    trainingSession,
    wordCount,
    practiceLanguage,
    knownWords,
  }: {
    trainingSession: TrainingSession;
    wordCount: number;
    practiceLanguage: Language;
    knownWords: string[];
  },
  ctx: ProtectedCtx,
): Promise<string[]> => {
  const trainingSessionWordsList = await ctx.db
    .select({ word: words.word })
    .from(trainingSessionWords)
    .innerJoin(words, eq(words.id, trainingSessionWords.wordId))
    .where(eq(trainingSessionWords.trainingSessionId, trainingSession.id));
  if (trainingSessionWordsList.length > 0) {
    return trainingSessionWordsList.map((word) => word.word);
  }

  const currentPracticeWordsList = await ctx.db
    .select({ word: words.word })
    .from(userWords)
    .innerJoin(words, eq(words.id, userWords.wordId))
    .where(
      and(
        eq(userWords.userId, ctx.session.user.id),
        eq(words.languageCode, trainingSession.languageCode),
        isNull(userWords.knownAt),
        or(
          isNull(userWords.nextPracticeAt),
          lte(userWords.nextPracticeAt, sql`NOW()`),
        ),
      ),
    )
    .orderBy(desc(userWords.seenCount));

  let practiceWordsList: string[] = [];

  if (trainingSession.topic && currentPracticeWordsList.length > 0) {
    const _prompt = pickReleventWordsForATopic({
      topic: trainingSession.topic,
      wordCount: wordCount,
      words: currentPracticeWordsList.map((word) => word.word),
    });
    const pickedWords = await generateObject({
      model: openai("gpt-4o", { user: ctx.session.user.id }),
      schema: z.object({
        words: z.array(z.string()).describe("list of picked words"),
      }),
      prompt: _prompt,
    });
    practiceWordsList = pickedWords.object.words;
  } else {
    practiceWordsList = currentPracticeWordsList
      .map((word) => word.word)
      .slice(0, wordCount);
  }

  if (practiceWordsList.length < wordCount) {
    const NEW_WORD_COUNT = wordCount - practiceWordsList.length;
    const _prompt = getMoreWordsPrompt({
      wordCount: NEW_WORD_COUNT,
      practiceLanguage: practiceLanguage.name,
      topic: trainingSession.topic?.trim(),
      currentWords: [...practiceWordsList, ...knownWords],
    });

    const _result = await generateObject({
      model: openai("gpt-4o", { user: ctx.session.user.id }),
      schema: z.object({
        words: z.array(z.string()).describe("list of words in lemma form"),
      }),
      prompt: _prompt,
    });

    const newWords = await Promise.all(
      _result.object.words.map((word) =>
        getOrCreateWord(word, trainingSession.languageCode, ctx.db),
      ),
    );

    await ctx.db
      .insert(userWords)
      .values(
        newWords.map(
          (word) =>
            ({
              wordId: word.id,
              userId: ctx.session.user.id,
            }) satisfies typeof userWords.$inferInsert,
        ),
      )
      .onConflictDoNothing();

    practiceWordsList = [
      ...new Set([...practiceWordsList, ...newWords.map((word) => word.word)]),
    ];
  }

  console.log("Final Practice Words", practiceWordsList);

  return practiceWordsList;
};

export const getSentenceOrThrow = async (
  sentenceId: string,
  ctx: ProtectedCtx,
) => {
  const [sentence] = await ctx.db
    .select()
    .from(sentences)
    .where(eq(sentences.id, sentenceId));

  if (!sentence) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Sentence not found!",
    });
  }

  return sentence;
};
