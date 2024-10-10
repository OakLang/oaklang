import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { createPrefixedId } from "../utils";
import { languages } from "./language";
import { userWords } from "./user-word";

export const words = pgTable(
  "word",
  {
    id: text()
      .notNull()
      .primaryKey()
      .$defaultFn(() => createPrefixedId("word")),
    createdAt: timestamp().notNull().defaultNow(),
    word: text().notNull(),
    languageCode: text()
      .notNull()
      .references(() => languages.code, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueIdx: unique().on(table.word, table.languageCode),
  }),
);
export type Word = typeof words.$inferSelect;
export type WordInsert = typeof words.$inferInsert;

export const wordsRelations = relations(words, ({ many, one }) => ({
  userWords: many(userWords),
  langauge: one(languages, {
    fields: [words.languageCode],
    references: [languages.code],
  }),
}));
