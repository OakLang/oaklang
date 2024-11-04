import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import {
  languagesTable,
  sentencesTable,
  sentenceWordsTable,
  userWordsTable,
  wordsTable,
} from "@acme/db/schema";

export const languageWithStats = createSelectSchema(languagesTable).and(
  z.object({
    knownWords: z.number(),
  }),
);

export type LanguageWithStats = z.infer<typeof languageWithStats>;

export const sentenceWithWords = createSelectSchema(sentencesTable).extend({
  sentenceWords: z.array(
    createSelectSchema(sentenceWordsTable, {
      interlinearLines: z.object({}).catchall(z.string()),
    }).extend({
      word: createSelectSchema(wordsTable),
    }),
  ),
});

export type SentenceWithWords = z.infer<typeof sentenceWithWords>;

export const userWordWithWordSchema = createSelectSchema(userWordsTable).extend(
  {
    word: createSelectSchema(wordsTable),
  },
);

export type UserWordWithWord = z.infer<typeof userWordWithWordSchema>;

export const paginationBaseSchema = z.object({
  size: z.number().min(1).max(100).optional().default(10),
  page: z.number().optional().default(1),
});

export const wordColumnEnum = z.enum([
  "word",
  "wordId",
  "createdAt",
  "createdFromId",
  "knownAt",
  "knownFromId",
  "lastSeenAt",
  "seenCount",
  "lastPracticedAt",
  "practiceCount",
  "seenCountSinceLastPracticed",
  "nextPracticeAt",
  "hideLines",
  "markedUnknownCount",
  "lastMarkedUnknownAt",
  "dissableHideLinesCount",
  "lastDissabledHideLinesAt",
]);

export const wordFilterEnum = z.enum(["all", "known", "unknown", "practicing"]);
