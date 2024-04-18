import { z } from 'zod';
import { protectedProcedure, router } from 'src/server/trpc';
import { extractWordsAndPhrasesWithAI } from '~/utils/openai';

export const aiRouter = router({
  extractWords: protectedProcedure.input(z.string()).mutation(async (otps) => {
    const words = await extractWordsAndPhrasesWithAI(otps.input);
    return words;
  }),
});
