import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { createPrefixedId } from "../utils";
import { languagesTable } from "./language";
import { sentenceWordsTable } from "./sentence";
import { trainingSessionWordsTable } from "./training-session";
import { userWordsTable } from "./user-word";

export const wordsTable = pgTable(
  "word",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createPrefixedId("word")),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    word: text("word").notNull(),
    languageCode: text("language_code")
      .notNull()
      .references(() => languagesTable.code, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueIdx: unique().on(table.word, table.languageCode),
  }),
);
export type Word = typeof wordsTable.$inferSelect;
export type WordInsert = typeof wordsTable.$inferInsert;

export const wordsRelations = relations(wordsTable, ({ many, one }) => ({
  userWords: many(userWordsTable),
  trainingSessionWords: many(trainingSessionWordsTable),
  sentenceWords: many(sentenceWordsTable),
  langauge: one(languagesTable, {
    fields: [wordsTable.languageCode],
    references: [languagesTable.code],
  }),
}));
