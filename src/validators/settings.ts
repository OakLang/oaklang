import { z } from 'zod';

export const complexityEnum = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
export type Complexity = z.infer<typeof complexityEnum>;

export const sentencesGeneratorSettingsSchema = z.object({
  complexity: complexityEnum,
  helpLanguage: z.string().min(1),
  practiceLanguage: z.string().min(1),
  prompt: z.string(),
  sentencesCount: z.number().min(1).max(5),
});

export type SentencesGeneratorSettings = z.infer<typeof sentencesGeneratorSettingsSchema>;

export const DEFAULT_PROMPT = `You are a {{PRACTICE_LANGUAGE}} tutor providing carefully constructed sentences to a student designed to help them practice the new vocabulary and grammar they are learning and exercise already known vocabulary and grammar. You thoughtfully construct sentences, stories, dialogues, and exercises that use your language naturally while using known vocabulary. 

Please provide a series of {{SENTENCE_COUNT}} sentences suitable for an {{COMPLEXITY}} {{PRACTICE_LANGUAGE}} student using as many words from the {{PRACTICE_VOCABS}} list as possible and restricting other words to those in the {{KNOWN_VOCABS}} list.

PRACTICE LANGUAGE: "{{PRACTICE_LANGUAGE}}"

HELP LANGUAGE: "{{HELP_LANGUAGE}}"

PRACTICE VOCABS: "{{PRACTICE_VOCABS}}"

KNOWN VOCABS: "{{KNOWN_VOCABS}}"`;

export const initialSentencesGeneratorSettings: SentencesGeneratorSettings = {
  complexity: 'A1',
  helpLanguage: 'English',
  practiceLanguage: 'Spanish',
  prompt: DEFAULT_PROMPT,
  sentencesCount: 3,
};
