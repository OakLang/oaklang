import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { generateSentenceObjectSchema, generateSentenceBody } from '~/validators/generate-sentence';
import type { GenerateSentenceApiResponse } from '~/validators/generate-sentence';
import type { Settings } from '~/validators/settings';

const buildPrompt = ({
  knownVocabs,
  practiceVocabs,
  settings,
}: {
  knownVocabs: string[];
  practiceVocabs: string[];
  settings: Settings;
}) => {
  return settings.prompt
    .replaceAll('{{SENTENCE_COUNT}}', String(settings.sentencesCount))
    .replaceAll('{{PRACTICE_LANGUAGE}}', settings.practiceLanguage)
    .replaceAll('{{HELP_LANGUAGE}}', settings.helpLanguage)
    .replaceAll('{{PRACTICE_VOCABS}}', practiceVocabs.join(', '))
    .replaceAll('{{KNOWN_VOCABS}}', knownVocabs.join(', '))
    .replaceAll('{{COMPLEXITY}}', settings.complexity);
};

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const { knownVocabs, practiceVocabs, settings } = await generateSentenceBody.parseAsync(body);
  console.log('Generate Sentences', body);

  const prompt = buildPrompt({ knownVocabs, practiceVocabs, settings });
  const result = await generateObject({
    model: openai('gpt-4o'),
    prompt,
    schema: generateSentenceObjectSchema,
  });

  const newVocabs = result.object.sentences.flatMap((sentence) => sentence.lexicons.flatMap((lexicon) => lexicon.lemma));
  const uniqueVocabs = newVocabs.filter((vocab) => !practiceVocabs.includes(vocab));
  return NextResponse.json({
    knownVocabs,
    practiceVocabs: [...practiceVocabs, ...uniqueVocabs],
    sentences: result.object.sentences,
  } satisfies GenerateSentenceApiResponse);
};
