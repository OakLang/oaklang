import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { createPrefixedId } from "../utils";
import { users } from "./auth";
import { languages } from "./language";
import { trainingSessions } from "./training-session";

export const words = pgTable(
  "word",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createPrefixedId("word")),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    languageCode: text("language_code")
      .notNull()
      .references(() => languages.code, { onDelete: "cascade" }),
    word: text("word").notNull(),
    knownAt: timestamp("knwon_at"),
  },
  (table) => ({
    uniqueIdx: unique().on(table.userId, table.word, table.languageCode),
  }),
);
export type Word = typeof words.$inferSelect;
export type WordInsert = typeof words.$inferInsert;

export const wordsFromTrainingSession = pgTable(
  "word_from_training_session",
  {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    wordId: text("word_id")
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
    trainingSessionId: text("training_session_id")
      .notNull()
      .references(() => trainingSessions.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueIdx: unique().on(table.trainingSessionId, table.wordId),
  }),
);

export type WordFromTrainingSession =
  typeof wordsFromTrainingSession.$inferSelect;
export type WordFromTrainingSessionInsert =
  typeof wordsFromTrainingSession.$inferInsert;
