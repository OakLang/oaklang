import { audioSettingsSchema } from '@acme/validators';
import { openai } from '@acme/api/openai';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const bodySchema = z.object({
  input: z.string().min(0).max(4096),
  settings: audioSettingsSchema,
});

export type TTSBodyParams = z.infer<typeof bodySchema>;

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  console.log(body);
  const {
    input,
    settings: { speed, voice },
  } = await bodySchema.parseAsync(body);
  const mp3 = await openai.audio.speech.create({ input, model: 'tts-1', speed, voice });
  const buffer = Buffer.from(await mp3.arrayBuffer());
  return new NextResponse(buffer);
};
