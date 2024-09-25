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
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createPrefixedId("sent")),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    trainingSessionId: text("training_session_id")
      .notNull()
      .references(() => trainingSessions.id, { onDelete: "cascade" }),
    sentence: text("sentence").notNull(),
    translation: text("translation").notNull(),
    index: integer("index").notNull(),
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
    sentenceId: text("sentence_id")
      .notNull()
      .references(() => sentences.id, { onDelete: "cascade" }),
    wordId: text("word_id")
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
    index: integer("index").notNull(),
    interlinearLines: jsonb("interlinear_lines")
      .notNull()
      .$type<Record<string, string>>(),
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
