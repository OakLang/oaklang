import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { openai } from '../libs/openai';

export const ttsRouter = createTRPCRouter({
  generateTTS: publicProcedure
    .input(z.object({ speed: z.number().min(0.24).max(4).optional(), text: z.string().min(1).max(1000) }))
    .mutation(async ({ input: { text, speed } }) => {
      await openai.audio.speech.create({ input: text, model: 'tts-1', speed, voice: 'alloy' });
    }),
});
