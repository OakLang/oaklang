import { z } from 'zod';

export const generateSentenceBody = z.object({
  helpLanguage: z.string().min(1),
  knownVocabs: z.array(z.string().min(1)),
  numberOfTimeToPractice: z.number().min(1).max(20),
  practiceLanguage: z.string().min(1),
  practiceVocabs: z.array(z.string().min(1)),
  prompt: z.string(),
  sentencesCount: z.number().min(1).max(5),
});

export type GenerateSentenceBody = z.infer<typeof generateSentenceBody>;

export const sentenceSchema = z.object({
  lexicons: z
    .array(
      z.object({
        ipa: z.string().describe('lexicon pronunciation in IPA format'),
        lemma: z.string().describe('lemma form of the lexicon translated in HELP LANGUAGE'),
        lexicon: z.string().describe('lexicon in PRACTICE LANGUAGE'),
        translation: z.string().describe('lexicon translation in HELP LANGUAGE'),
      }),
    )
    .describe('list of lexicons to build the full sentence'),
  // definitions: z.array(z.string()).describe('list of definitions that are direct translations to PRACTICE LANGUAGE.'),
  // ipa: z.array(z.string()).describe('list of pronunciations in IPA format.'),
  // lemmas: z.array(z.string()).describe('list of words in lemma form in HELP LANGUAGE'),
  // translation: z.string().describe('the full translated sentence in HELP LANGUAGE.'),
  // translations: z.array(z.string()).describe('list of words to build the translated full sentence in HELP LANGUAGE.'),
  // words: z.array(z.string()).describe('list of words to build the full sentence in PRACTICE LANGUAGE.'),
  sentence: z.string().describe('the full sentence in PRACTICE LANGUAGE.'),
});

export type Sentence = z.infer<typeof sentenceSchema>;

export const generateSentenceObjectSchema = z.object({
  sentences: z.array(sentenceSchema),
});

export const generateSentenceApiResponse = z.object({
  practiceVocabs: z.array(z.string().min(1)),
  prompt: z.string(),
  sentences: z.array(sentenceSchema),
});

export type GenerateSentenceApiResponse = z.infer<typeof generateSentenceApiResponse>;
