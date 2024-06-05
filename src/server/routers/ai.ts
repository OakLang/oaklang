import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from 'src/server/trpc';
import { extractLexiconsWithAI } from '~/utils/openai';
import { generateSentenceBody, generateSentenceObjectSchema } from '~/validators/generate-sentence';
import type { SentenceWithId } from '~/validators/generate-sentence';
import type { SentencesGeneratorSettings } from '~/validators/settings';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { nanoid } from 'nanoid';

const buildPrompt = ({
  knownVocabs,
  practiceVocabs,
  settings,
}: {
  knownVocabs: string[];
  practiceVocabs: string[];
  settings: SentencesGeneratorSettings;
}) => {
  return settings.prompt
    .replaceAll('{{SENTENCE_COUNT}}', String(settings.sentencesCount))
    .replaceAll('{{PRACTICE_LANGUAGE}}', settings.practiceLanguage)
    .replaceAll('{{HELP_LANGUAGE}}', settings.helpLanguage)
    .replaceAll('{{PRACTICE_VOCABS}}', practiceVocabs.join(', '))
    .replaceAll('{{KNOWN_VOCABS}}', knownVocabs.join(', '))
    .replaceAll('{{COMPLEXITY}}', settings.complexity);
};

export const aiRouter = router({
  extractLexicons: protectedProcedure.input(z.string()).mutation(async (otps) => {
    const lexicons = await extractLexiconsWithAI(otps.input);
    return lexicons;
  }),
  generateSentences: publicProcedure.input(generateSentenceBody).mutation(async ({ input: { knownVocabs, practiceVocabs, settings } }) => {
    const prompt = buildPrompt({ knownVocabs, practiceVocabs, settings });
    const result = await generateObject({
      model: openai('gpt-4o'),
      prompt,
      schema: generateSentenceObjectSchema,
    });

    return result.object.sentences.map<SentenceWithId>((sentence) => ({ ...sentence, id: nanoid() }));
  }),
});
