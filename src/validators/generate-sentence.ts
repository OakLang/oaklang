import { z } from 'zod';
import { settingsSchema } from './settings';

export const generateSentenceBody = z.object({
  knownVocabs: z.array(z.string().min(1)),
  practiceVocabs: z.array(z.string().min(1)),
  settings: settingsSchema,
});

export type GenerateSentenceBody = z.infer<typeof generateSentenceBody>;

export const sentenceSchema = z.object({
  lexicons: z
    .array(
      z.object({
        ipa: z.string().describe('lexicon pronunciation in IPA format'),
        lemma: z.string().describe('lexicon in lemma form'),
        lexicon: z.string().describe('lexicon in PRACTICE LANGUAGE'),
        translation: z.string().describe('lexicon translation in HELP LANGUAGE'),
      }),
    )
    .describe('list of lexicons to build the full sentence'),
  sentence: z.string().describe('the full sentence in PRACTICE LANGUAGE.'),
});

export type Sentence = z.infer<typeof sentenceSchema>;

export const generateSentenceObjectSchema = z.object({
  sentences: z.array(sentenceSchema),
});

export const generateSentenceApiResponse = z.object({
  knownVocabs: z.array(z.string().min(1)),
  practiceVocabs: z.array(z.string().min(1)),
  sentences: z.array(sentenceSchema),
});

export type GenerateSentenceApiResponse = z.infer<typeof generateSentenceApiResponse>;
