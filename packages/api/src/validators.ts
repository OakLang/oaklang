import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { languages, sentences, sentenceWords, words } from "@acme/db/schema";

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
