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
  // return NextResponse.json({
  //   knownVocabs: [],
  //   practiceVocabs: [
  //     'el',
  //     'casa',
  //     'ser',
  //     'grande',
  //     'el',
  //     'gato',
  //     'comer',
  //     'ella',
  //     'ser',
  //     'mío',
  //     'amiga',
  //     'tener',
  //     'un',
  //     'libro',
  //     'el',
  //     'perro',
  //     'ser',
  //     'bonito',
  //   ],
  //   sentences: [
  //     {
  //       lexicons: [
  //         {
  //           ipa: 'la',
  //           lemma: 'el',
  //           lexicon: 'La',
  //           translation: 'The',
  //         },
  //         {
  //           ipa: 'ˈkasa',
  //           lemma: 'casa',
  //           lexicon: 'casa',
  //           translation: 'house',
  //         },
  //         {
  //           ipa: 'es',
  //           lemma: 'ser',
  //           lexicon: 'es',
  //           translation: 'is',
  //         },
  //         {
  //           ipa: 'ˈɡɾande',
  //           lemma: 'grande',
  //           lexicon: 'grande',
  //           translation: 'big',
  //         },
  //       ],
  //       sentence: 'La casa es grande.',
  //     },
  //     {
  //       lexicons: [
  //         {
  //           ipa: 'el',
  //           lemma: 'el',
  //           lexicon: 'El',
  //           translation: 'The',
  //         },
  //         {
  //           ipa: 'ˈɡato',
  //           lemma: 'gato',
  //           lexicon: 'gato',
  //           translation: 'cat',
  //         },
  //         {
  //           ipa: 'ˈkome',
  //           lemma: 'comer',
  //           lexicon: 'come',
  //           translation: 'eats',
  //         },
  //       ],
  //       sentence: 'El gato come.',
  //     },
  //     {
  //       lexicons: [
  //         {
  //           ipa: 'ˈeʝa',
  //           lemma: 'ella',
  //           lexicon: 'Ella',
  //           translation: 'She',
  //         },
  //         {
  //           ipa: 'es',
  //           lemma: 'ser',
  //           lexicon: 'es',
  //           translation: 'is',
  //         },
  //         {
  //           ipa: 'mi',
  //           lemma: 'mío',
  //           lexicon: 'mi',
  //           translation: 'my',
  //         },
  //         {
  //           ipa: 'aˈmiɣa',
  //           lemma: 'amiga',
  //           lexicon: 'amiga',
  //           translation: 'friend',
  //         },
  //       ],
  //       sentence: 'Ella es mi amiga.',
  //     },
  //     {
  //       lexicons: [
  //         {
  //           ipa: 'ˈteŋɡo',
  //           lemma: 'tener',
  //           lexicon: 'Tengo',
  //           translation: 'I have',
  //         },
  //         {
  //           ipa: 'un',
  //           lemma: 'un',
  //           lexicon: 'un',
  //           translation: 'a',
  //         },
  //         {
  //           ipa: 'ˈliβɾo',
  //           lemma: 'libro',
  //           lexicon: 'libro',
  //           translation: 'book',
  //         },
  //       ],
  //       sentence: 'Tengo un libro.',
  //     },
  //     {
  //       lexicons: [
  //         {
  //           ipa: 'el',
  //           lemma: 'el',
  //           lexicon: 'El',
  //           translation: 'The',
  //         },
  //         {
  //           ipa: 'ˈpero',
  //           lemma: 'perro',
  //           lexicon: 'perro',
  //           translation: 'dog',
  //         },
  //         {
  //           ipa: 'es',
  //           lemma: 'ser',
  //           lexicon: 'es',
  //           translation: 'is',
  //         },
  //         {
  //           ipa: 'boˈnito',
  //           lemma: 'bonito',
  //           lexicon: 'bonito',
  //           translation: 'cute',
  //         },
  //       ],
  //       sentence: 'El perro es bonito.',
  //     },
  //   ],
  // });
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
