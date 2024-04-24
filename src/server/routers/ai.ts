import { z } from 'zod';
import { protectedProcedure, router } from 'src/server/trpc';
import { extractLexiconsWithAI } from '~/utils/openai';

export const aiRouter = router({
  extractLexicons: protectedProcedure.input(z.string()).mutation(async (otps) => {
    const lexicons = await extractLexiconsWithAI(otps.input);
    return lexicons;
  }),
});
