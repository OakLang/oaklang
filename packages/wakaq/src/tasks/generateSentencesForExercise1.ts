import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import stringTemplate from "string-template";
import { z } from "zod";

import type { Language } from "@acme/db/schema";
import { EXERCISE_1, Exercises } from "@acme/core/constants";
import { and, asc, desc, eq, isNull, lte, not, or, sql } from "@acme/db";
import { db } from "@acme/db/client";
import {
  aiUsageTable,
  languagesTable,
  sentencesTable,
  trainingSessionsTable,
  usersTable,
  userWordsTable,
  wordsTable,
} from "@acme/db/schema";
import { exercise1Data } from "@acme/db/validators";

import { wakaq } from "..";
import {
  getNativeLanguage,
  getOrCreateWords,
  insertUserWords,
} from "../helpers";
import { generateInterlinearLineForSentence } from "./generateInterlinearLinesForSentence";

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

const getPracticeWordsList = async ({
  wordCount,
  practiceLanguage,
  knownWords,
  topic,
  userId,
}: {
  wordCount: number;
  practiceLanguage: Language;
  knownWords: string[];
  topic?: string;
  userId: string;
}): Promise<string[]> => {
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
    const _prompt = pickReleventWordsForATopic({
      topic,
      wordCount: wordCount,
      words: currentPracticeWordsList.map((word) => word.word),
    });
    const pickedWords = await generateObject({
      model: openai("gpt-4o", { user: userId }),
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
      model: openai("gpt-4o", { user: userId }),
      schema: z.object({
        words: z.array(z.string()).describe("list of words in lemma form"),
      }),
      prompt: _prompt,
    });

    const newWords = await getOrCreateWords(
      _result.object.words,
      practiceLanguage.code,
    );
    await insertUserWords(newWords, userId);

    practiceWordsList = [
      ...new Set([...practiceWordsList, ..._result.object.words]),
    ];
  }

  return practiceWordsList;
};

export const generateSentencesForExercise1 = wakaq.task(
  async (args) => {
    const { trainingSessionId, promptTemplate } = await z
      .object({
        promptTemplate: z.string().nullish(),
        trainingSessionId: z.string(),
      })
      .parseAsync(args);

    wakaq.logger?.info(
      `Running Task: generateSentencesForExercise1. Training Session Id: ${trainingSessionId}`,
    );

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

    if (trainingSession.exercise !== Exercises.exercise1) {
      throw new Error("Training session is not for exercise 1");
    }

    if (trainingSession.status === "pending") {
      throw new Error("Already Pending!");
    }

    await db
      .update(trainingSessionsTable)
      .set({
        status: "pending",
      })
      .where(eq(trainingSessionsTable.id, trainingSession.id));

    // TODO: Add Status
    // Check if playground is for exercise 1 and show spinners accordingly
    try {
      const practiceLanguage = trainingSession.language;
      const data = await exercise1Data.parseAsync(trainingSession.data);
      const nativeLanguage = await getNativeLanguage(trainingSession.userId);

      const model = openai("gpt-4o", { user: trainingSession.userId });

      const knownWords = await db
        .select({ word: wordsTable.word })
        .from(userWordsTable)
        .innerJoin(wordsTable, eq(wordsTable.id, userWordsTable.wordId))
        .where(
          and(
            eq(userWordsTable.userId, trainingSession.userId),
            eq(wordsTable.languageCode, trainingSession.languageCode),
            not(isNull(userWordsTable.knownAt)),
          ),
        )
        .orderBy(desc(userWordsTable.knownAt))
        .then((res) => res.map((item) => item.word));

      let practiceWordsList: string[] = data.words ?? [];
      if (practiceWordsList.length === 0) {
        practiceWordsList = await getPracticeWordsList({
          wordCount: 30,
          practiceLanguage,
          knownWords,
          topic: data.topic,
          userId: trainingSession.userId,
        });
      }

      const previouslyGeneratedSentences = await db
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
        promptTemplate ?? EXERCISE_1.promptTemplate,
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

      await db.insert(aiUsageTable).values({
        platform: "openai",
        model: "gpt-4o",
        generationType: "object",
        prompt: sentenceGeneratorPrompt,
        result,
        tokenCount: result.usage.totalTokens,
        userId: trainingSession.userId,
        userEmail: trainingSession.userEmail,
        metadata: {
          trainingSessionId,
          sentences: result.object.sentences,
          zodSchema: schema,
        },
      });

      const validatedSentences = result.object.sentences;
      const lastSentenceIndex =
        previouslyGeneratedSentences.at(-1)?.index ?? -1;
      const values = validatedSentences.map(
        (sentence, index) =>
          ({
            index: lastSentenceIndex + 1 + index,
            sentence: sentence.sentence,
            translation: sentence.translation,
            trainingSessionId: trainingSession.id,
          }) satisfies typeof sentencesTable.$inferInsert,
      );

      if (values.length > 0) {
        const sentences = await db
          .insert(sentencesTable)
          .values(values)
          .returning({ id: sentencesTable.id });
        for (const sentence of sentences) {
          await generateInterlinearLineForSentence.enqueue({
            sentenceId: sentence.id,
          });
        }
      }

      await db
        .update(trainingSessionsTable)
        .set({
          status: "success",
        })
        .where(eq(trainingSessionsTable.id, trainingSession.id));
    } catch (error) {
      await db
        .update(trainingSessionsTable)
        .set({
          status: "error",
        })
        .where(eq(trainingSessionsTable.id, trainingSession.id));
    }
  },
  { name: "generateSentencesForExercise1" },
);
