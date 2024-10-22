import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { createPrefixedId } from "../utils";
import { trainingSessionsTable } from "./training-session";
import { wordsTable } from "./word";

export const sentenceInterlinearLineGenerationStatus = pgEnum(
  "sentence_interlinear_line_generation_status",
  ["idle", "pending", "success", "failed", "canceled"],
);

export const sentencesTable = pgTable(
  "sentence",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createPrefixedId("sent")),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    trainingSessionId: text("training_session_id")
      .notNull()
      .references(() => trainingSessionsTable.id, { onDelete: "cascade" }),
    sentence: text("sentence").notNull(),
    translation: text("translation").notNull(),
    index: integer("index").notNull(),
    interlinearLineGenerationStatus: sentenceInterlinearLineGenerationStatus(
      "interlinear_line_generation_status",
    )
      .notNull()
      .default("idle"),
    completedAt: timestamp("completed_at"),
  },
  (table) => ({
    uniqueIdx: unique().on(table.trainingSessionId, table.index),
  }),
);
export type Sentence = typeof sentencesTable.$inferSelect;
export type SentenceInsert = typeof sentencesTable.$inferInsert;

export const sentencesRelations = relations(
  sentencesTable,
  ({ one, many }) => ({
    trainingSession: one(trainingSessionsTable, {
      fields: [sentencesTable.trainingSessionId],
      references: [trainingSessionsTable.id],
    }),
    sentenceWords: many(sentenceWordsTable),
  }),
);

export const sentenceWordsTable = pgTable(
  "sentence_word",
  {
    sentenceId: text("sentence_id")
      .notNull()
      .references(() => sentencesTable.id, { onDelete: "cascade" }),
    wordId: text("word_id")
      .notNull()
      .references(() => wordsTable.id, { onDelete: "cascade" }),
    index: integer("index").notNull(),
    interlinearLines: jsonb("interlinear_lines")
      .notNull()
      .$type<Record<string, string>>(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.sentenceId, table.index] }),
  }),
);

export type SentenceWord = typeof sentenceWordsTable.$inferSelect;

export const sentenceWordsRelations = relations(
  sentenceWordsTable,
  ({ one }) => ({
    sentence: one(sentencesTable, {
      fields: [sentenceWordsTable.sentenceId],
      references: [sentencesTable.id],
    }),
    word: one(wordsTable, {
      fields: [sentenceWordsTable.wordId],
      references: [wordsTable.id],
    }),
  }),
);
