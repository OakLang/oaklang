import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { nanoid } from 'nanoid';
import { createTRPCRouter, publicProcedure } from '../trpc';
import type { SentenceWithId, SentencesGeneratorSettings} from '@acme/validators';
import { generateSentenceBody, generateSentenceObjectSchema } from '@acme/validators'

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

export const aiRouter = createTRPCRouter({
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
