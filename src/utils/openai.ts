import { z } from 'zod';
import { extractWords } from './helpers';

export const extractWordsAndPhrasesWithAI = async (paragraph: string) => {
  await z.string().max(2000).parseAsync(paragraph);
  // For now let's just extract all the words. Will focus on phrases later
  return extractWords(paragraph);
};
