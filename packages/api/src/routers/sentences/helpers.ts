import type { ZodString } from "zod";
import { openai } from "@ai-sdk/openai";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import stringTemplate from "string-template";
import { z } from "zod";

import type { Language, TrainingSession, UserSettings } from "@acme/db/schema";
import type { Exercise1FormData } from "@acme/db/validators";
import { EXERCISE_1, Exercises } from "@acme/core/constants";
import { and, asc, desc, eq, isNull, lte, not, or, sql } from "@acme/db";
import { sentencesTable, userWordsTable, wordsTable } from "@acme/db/schema";

import type { ProtectedCtx } from "../../utils";
import {
  getLanguageOrThrow,
  getNativeLanguageOrThrow,
  getOrCreateWord,
} from "../../utils";

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
    wordCount,
    practiceLanguage,
    knownWords,
    topic,
  }: {
    wordCount: number;
    practiceLanguage: Language;
    knownWords: string[];
    topic?: string;
  },
  ctx: ProtectedCtx,
): Promise<string[]> => {
  const currentPracticeWordsList = await ctx.db
    .select({ word: wordsTable.word })
    .from(userWordsTable)
    .innerJoin(wordsTable, eq(wordsTable.id, userWordsTable.wordId))
    .where(
      and(
        eq(userWordsTable.userId, ctx.session.user.id),
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
    const _prompt = pickReleventWordsForATopic({
      topic,
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
      topic: topic?.trim(),
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
        getOrCreateWord(word, practiceLanguage.code, ctx.db),
      ),
    );

    await ctx.db
      .insert(userWordsTable)
      .values(
        newWords.map(
          (word) =>
            ({
              wordId: word.id,
              userId: ctx.session.user.id,
            }) satisfies typeof userWordsTable.$inferInsert,
        ),
      )
      .onConflictDoNothing();

    practiceWordsList = [
      ...new Set([...practiceWordsList, ...newWords.map((word) => word.word)]),
    ];
  }

  return practiceWordsList;
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

export const getSentencesForExercise1 = async (
  trainingSession: TrainingSession,
  ctx: ProtectedCtx,
  promptTemplate = EXERCISE_1.promptTemplate,
) => {
  if (trainingSession.exercise !== Exercises.exercies1) {
    return [];
  }
  const PRACTICE_WORDS_COUNT = 30;
  const data = trainingSession.data as Exercise1FormData["data"];

  const nativeLanguage = await getNativeLanguageOrThrow(ctx);
  const practiceLanguage = await getLanguageOrThrow(
    trainingSession.languageCode,
    ctx.db,
  );

  const model = openai("gpt-4o", { user: ctx.session.user.id });

  const knownWords = await ctx.db
    .select({ word: wordsTable.word })
    .from(userWordsTable)
    .innerJoin(wordsTable, eq(wordsTable.id, userWordsTable.wordId))
    .where(
      and(
        eq(userWordsTable.userId, ctx.session.user.id),
        eq(wordsTable.languageCode, practiceLanguage.code),
        not(isNull(userWordsTable.knownAt)),
      ),
    )
    .orderBy(desc(userWordsTable.knownAt))
    .then((res) => res.map((item) => item.word));

  const practiceWordsList =
    data.words && data.words.length > 0
      ? data.words
      : await getPracticeWordsList(
          {
            wordCount: PRACTICE_WORDS_COUNT,
            practiceLanguage,
            knownWords,
            topic: data.topic,
          },
          ctx,
        );

  const previouslyGeneratedSentences = await ctx.db
    .select({
      index: sentencesTable.index,
      sentence: sentencesTable.sentence,
    })
    .from(sentencesTable)
    .where(eq(sentencesTable.trainingSessionId, trainingSession.id))
    .orderBy(asc(sentencesTable.index));

  const TEMPLATE_OBJECT = {
    SENTENCE_COUNT: 5,
    PRACTICE_LANGUAGE: practiceLanguage.name,
    NATIVE_LANGUAGE: nativeLanguage.name,
    PRACTICE_WORDS: practiceWordsList.join(", "),
    KNOWN_WORDS: knownWords.join(", "),
    COMPLEXITY: data.complexity,
    PREVIOUSLY_GENERATED_SENTENCES: previouslyGeneratedSentences
      .map((sen) => `${sen.index}. ${sen.sentence}`)
      .join("\n"),
    TOPIC: data.topic.trim(),
  };

  const sentenceGeneratorPrompt = stringTemplate(
    promptTemplate,
    TEMPLATE_OBJECT,
  );

  const schema = z.object({
    sentences: z.array(
      z.object({
        sentence: z
          .string()
          .describe(
            stringTemplate(
              "The full sentence in {PRACTICE_LANGUAGE} language.",
              TEMPLATE_OBJECT,
            ),
          ),
        translation: z
          .string()
          .describe(
            stringTemplate(
              "The full sentence translation in {NATIVE_LANGUAGE}",
              TEMPLATE_OBJECT,
            ),
          ),
      }),
    ),
  });

  const result = await generateObject({
    model,
    prompt: sentenceGeneratorPrompt,
    schema,
  });

  const validatedSentences = result.object.sentences;

  const lastSentenceIndex = previouslyGeneratedSentences.at(-1)?.index ?? 0;

  const newSentences = await ctx.db
    .insert(sentencesTable)
    .values(
      validatedSentences.map((sentence, index) => ({
        index: lastSentenceIndex + 1 + index,
        sentence: sentence.sentence,
        translation: sentence.translation,
        trainingSessionId: trainingSession.id,
      })),
    )
    .returning();

  return newSentences.sort((a, b) => a.index - b.index);
};
