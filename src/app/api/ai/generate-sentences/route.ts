import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { generateSentenceObjectSchema, generateSentenceBody } from '~/validators/generate-sentence';
import type { GenerateSentenceApiResponse } from '~/validators/generate-sentence';

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const { helpLanguage, knownVocabs, practiceLanguage, practiceVocabs, prompt, sentencesCount, numberOfTimeToPractice } =
    await generateSentenceBody.parseAsync(body);
  console.log('Generate Sentences', body);

  console.log(prompt);

  const result = await generateObject({
    model: openai('gpt-4o'),
    prompt: prompt
      .replaceAll('{{SENTENCE_COUNT}}', String(sentencesCount))
      .replaceAll('{{NUMBER_OF_TIME_TO_PRACTICE}}', String(numberOfTimeToPractice))
      .replaceAll('{{PRACTICE_LANGUAGE}}', practiceLanguage)
      .replaceAll('{{HELP_LANGUAGE}}', helpLanguage)
      .replaceAll('{{PRACTICE_VOCABS}}', practiceVocabs.join(', '))
      .replaceAll('{{KNOWN_VOCABS}}', knownVocabs.join(', ')),
    schema: generateSentenceObjectSchema,
  });

  const newVocabs = result.object.sentences.flatMap((sentence) => sentence.lexicons.flatMap((lexicon) => lexicon.lemma));
  const uniqueVocabs = newVocabs.filter((vocab) => !practiceVocabs.includes(vocab));
  return NextResponse.json({
    practiceVocabs: [...practiceVocabs, ...uniqueVocabs],
    prompt,
    sentences: result.object.sentences,
  } satisfies GenerateSentenceApiResponse);
};
