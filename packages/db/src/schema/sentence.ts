import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { createPrefixedId } from "../utils";
import { trainingSessions } from "./training-session";
import { words } from "./word";

export const sentences = pgTable(
  "sentence",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createPrefixedId("sent")),
    createdAt: timestamp().notNull().defaultNow(),
    trainingSessionId: text()
      .notNull()
      .references(() => trainingSessions.id, { onDelete: "cascade" }),
    sentence: text().notNull(),
    translation: text().notNull(),
    index: integer().notNull(),
  },
  (table) => ({
    uniqueIdx: unique().on(table.trainingSessionId, table.index),
  }),
);
export type Sentence = typeof sentences.$inferSelect;
export type SentenceInsert = typeof sentences.$inferInsert;

export const sentencesRelations = relations(sentences, ({ one, many }) => ({
  trainingSession: one(trainingSessions, {
    fields: [sentences.trainingSessionId],
    references: [trainingSessions.id],
  }),
  sentenceWords: many(sentenceWords),
}));

export const sentenceWords = pgTable(
  "sentence_word",
  {
    sentenceId: text()
      .notNull()
      .references(() => sentences.id, { onDelete: "cascade" }),
    wordId: text()
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
    index: integer().notNull(),
    interlinearLines: jsonb().notNull().$type<Record<string, string>>(),
  },
  (table) => ({
    uniqueIdx: unique().on(table.sentenceId, table.index),
  }),
);

export type SentenceWord = typeof sentenceWords.$inferSelect;

export const sentenceWordsRelations = relations(sentenceWords, ({ one }) => ({
  sentence: one(sentences, {
    fields: [sentenceWords.sentenceId],
    references: [sentences.id],
  }),
  words: one(words, {
    fields: [sentenceWords.wordId],
    references: [words.id],
  }),
}));
