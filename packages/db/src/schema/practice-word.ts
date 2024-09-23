import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { users } from "./auth";
import { words } from "./word";

export const practiceWords = pgTable(
  "practice_word",
  {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    wordId: text("word_id")
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    practiceCount: integer("practice_count").notNull().default(0),
    knownAt: timestamp("known_at"),
  },
  (table) => ({
    uniqueIdx: unique().on(table.userId, table.wordId),
  }),
);

export const practiceWordsRelations = relations(practiceWords, ({ one }) => ({
  word: one(words, {
    fields: [practiceWords.wordId],
    references: [words.id],
  }),
  user: one(users, {
    fields: [practiceWords.userId],
    references: [users.id],
  }),
}));
