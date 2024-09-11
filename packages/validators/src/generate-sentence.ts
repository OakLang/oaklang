import { z } from "zod";

export const wordSchema = z.object({
  ipa: z.string().describe("word pronunciation in IPA format"),
  pronunciation: z
    .string()
    .describe("phonetic word pronunciation in HELP LANGUAGE"),
  lemma: z.string().describe("word in lemma form"),
  translation: z.string().describe("word translation in HELP LANGUAGE"),
  word: z.string().describe("word in PRACTICE LANGUAGE"),
  text: z
    .string()
    .describe(
      "whitespace delimeted text associated with word from the full sentence including capitalization and punctuatio",
    ),
});

export const sentenceSchema = z.object({
  sentence: z.string().describe(`the full sentence in PRACTICE LANGUAGE.`),
  translation: z
    .string()
    .describe(`the full sentence translation in HELP LANGUAGE`),
  words: z
    .array(wordSchema)
    .describe(`list of words to build the full sentence`),
});

export const generateSentenceObjectSchema = z.object({
  sentences: z.array(sentenceSchema).describe("list of sentences"),
});

export type GenerateSentenceObject = z.infer<
  typeof generateSentenceObjectSchema
>;

export const generateSentenceApiResponse = z.object({
  knownVocabs: z.array(z.string().min(1)),
  practiceVocabs: z.array(z.string().min(1)),
  sentences: z.array(sentenceSchema),
});

export type GenerateSentenceApiResponse = z.infer<
  typeof generateSentenceApiResponse
>;
