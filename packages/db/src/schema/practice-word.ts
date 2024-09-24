import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { users } from "./auth";
import { words } from "./word";

export const userWords = pgTable(
  "user_word",
  {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    wordId: text("word_id")
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    knownAt: timestamp("known_at"),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
    seenCount: integer("seen_count").notNull().default(1),
    lastPracticedAt: timestamp("last_practiced_at"),
    practiceCount: integer("practice_count").notNull().default(0),
    timesUsedSinceLastPractice: integer("times_used_since_last_practice")
      .notNull()
      .default(0),
    nextPracticeAt: timestamp("next_practice_at"),
  },
  (table) => ({
    uniqueIdx: unique().on(table.userId, table.wordId),
  }),
);

export const practiceWordsRelations = relations(userWords, ({ one }) => ({
  word: one(words, {
    fields: [userWords.wordId],
    references: [words.id],
  }),
  user: one(users, {
    fields: [userWords.userId],
    references: [users.id],
  }),
}));
