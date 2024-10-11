import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import {
  languages,
  sentences,
  sentenceWords,
  userWords,
  words,
} from "@acme/db/schema";

export const languageWithStats = createSelectSchema(languages).and(
  z.object({
    knownWords: z.number(),
  }),
);

export type LanguageWithStats = z.infer<typeof languageWithStats>;

export const sentenceWithWords = createSelectSchema(sentences).extend({
  sentenceWords: z.array(
    createSelectSchema(sentenceWords, {
      interlinearLines: z.object({}).catchall(z.string()),
    }).extend({
      word: createSelectSchema(words),
    }),
  ),
});

export type SentenceWithWords = z.infer<typeof sentenceWithWords>;

export const userWordWithWordSchema = createSelectSchema(userWords).extend({
  word: z.string(),
  languageCode: z.string(),
});

export type UserWordWithWord = z.infer<typeof userWordWithWordSchema>;

export const paginationBaseSchema = z.object({
  size: z.number().min(1).max(100).optional().default(10),
  page: z.number().optional().default(1),
});
