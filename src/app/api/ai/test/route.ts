import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const POST = async (req: NextRequest) => {
  const body = req.body;
  console.log(body);
  const helpLangauge = 'English';
  const practiceLangauge = 'Italian';
  const practiceVocabs = ['apple', 'eat', 'drink', 'banana'];
  const knownVocabs = [''];
  const result = await generateObject({
    model: openai('gpt-4o'),
    prompt: `Please provide a series of sentences suitable for an A1 ${practiceLangauge} student composing a story using each of the following words I want to practice at least 5 times using only words from Practice Vocabs and the Known Vocabs List below. Sentences should be constructed so it is hard to replace the focus word with another (ie, "the RED apple" is better than "the RED paper" since apples are often associated with the color red).
    
    Practice Vocabs: ${practiceVocabs.join(', ')}
    
    Known Vocabs: ${knownVocabs.join(', ')}
    `,
    schema: z.object({
      sentences: z.array(
        z.object({
          definitions: z.array(z.string()).describe(`list of definitions that are direct translations to ${practiceLangauge}.`),
          ipa: z.array(z.string()).describe('list of pronunciations in IPA.'),
          lemmas: z.array(z.string()).describe('list of words in lemma form.'),
          sentence: z.string().describe(`the full sentence in ${helpLangauge}.`),
          translation: z.string().describe(`the full translated sentence in ${helpLangauge}.`),
          translations: z.array(z.string()).describe(`list of words to build the translated full sentence in ${practiceLangauge}.`),
          words: z.array(z.string()).describe(`list of words to build the full sentence in ${helpLangauge}.`),
        }),
      ),
    }),
  });
  return NextResponse.json(result);
};
