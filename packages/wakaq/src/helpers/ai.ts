import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

import type { Language } from "@acme/db/schema";
import {
  generateMoreWordsWithoutTopicPrompt,
  generateMoreWordsWithTopicPrompt,
  getPickReleventWordsForATopicPrompt,
} from "@acme/core/constants/prompt-templates";
import { db } from "@acme/db/client";
import { aiUsageTable } from "@acme/db/schema";

import { getOrCreateWords, insertUserWords } from ".";

export async function generateSentences({
  nativeLanguage,
  practiceLanguage,
  prompt,
  trainingSessionId,
  userEmail,
  userId,
}: {
  prompt: string;
  practiceLanguage: string;
  nativeLanguage: string;
  userId: string;
  userEmail: string;
  trainingSessionId: string;
}): Promise<{ sentence: string; translation: string }[]> {
  const schema = z.object({
    sentences: z.array(
      z.object({
        sentence: z
          .string()
          .describe(`The full sentence in ${practiceLanguage} language.`),
        translation: z
          .string()
          .describe(
            `The full sentence translation in ${nativeLanguage} language.`,
          ),
      }),
    ),
  });

  const result = await generateObject({
    model: openai("gpt-4o", { user: userId }),
    schema,
    prompt,
  });

  await db.insert(aiUsageTable).values({
    platform: "openai",
    model: "gpt-4o",
    generationType: "object",
    prompt,
    result,
    type: "generate-sentences",
    tokenCount: result.usage.totalTokens,
    userId,
    userEmail,
    metadata: {
      trainingSessionId,
      sentences: result.object.sentences,
      zodSchema: schema,
    },
  });

  return result.object.sentences;
}

export async function getMoreWords({
  practiceLanguage,
  wordCount,
  topic,
  currentWords,
  userId,
  userEmail,
}: {
  topic?: string;
  wordCount: number;
  practiceLanguage: Language;
  currentWords: string[];
  userId: string;
  userEmail: string;
}): Promise<string[]> {
  const prompt = topic
    ? generateMoreWordsWithTopicPrompt({
        CURRENT_WORDS: currentWords.join(", "),
        PRACTICE_LANGUAGE: practiceLanguage.name,
        WORD_COUNT: wordCount,
        TOPIC: topic,
      })
    : generateMoreWordsWithoutTopicPrompt({
        CURRENT_WORDS: currentWords.join(", "),
        PRACTICE_LANGUAGE: practiceLanguage.name,
        WORD_COUNT: wordCount,
      });

  const schema = z.object({
    words: z.array(z.string()).describe("list of words in lemma form"),
  });

  const result = await generateObject({
    model: openai("gpt-4o", { user: userId }),
    schema,
    prompt,
  });

  await db.insert(aiUsageTable).values({
    platform: "openai",
    model: "gpt-4o",
    generationType: "object",
    prompt,
    result,
    type: "generate-more-words",
    tokenCount: result.usage.totalTokens,
    userId,
    userEmail,
    metadata: {
      words: result.object.words,
      zodSchema: schema,
    },
  });

  const words = [...new Set(result.object.words)];

  const newWords = await getOrCreateWords(words, practiceLanguage.code);
  await insertUserWords(newWords, userId);
  return [...new Set(result.object.words)];
}

export async function pickReleventWordsForATopic({
  topic,
  words,
  wordCount,
  userId,
  userEmail,
}: {
  topic: string;
  words: string[];
  wordCount: number;
  userId: string;
  userEmail: string;
}): Promise<string[]> {
  const prompt = getPickReleventWordsForATopicPrompt({
    TOPIC: topic,
    WORD_COUNT: wordCount,
    WORDS: words.join(", "),
  });

  const schema = z.object({
    words: z.array(z.string()).describe("list of picked words"),
  });

  const result = await generateObject({
    model: openai("gpt-4o", { user: userId }),
    schema,
    prompt,
  });

  await db.insert(aiUsageTable).values({
    platform: "openai",
    model: "gpt-4o",
    generationType: "object",
    prompt,
    result,
    type: "pick-relevent-words",
    tokenCount: result.usage.totalTokens,
    userId,
    userEmail,
    metadata: {
      words: result.object.words,
      zodSchema: schema,
    },
  });

  return [...new Set(result.object.words)];
}
