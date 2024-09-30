import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { words } from "./word";

export const userWords = pgTable(
  "user_word",
  {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdFromId: text("created_from_id"),
    wordId: text("word_id")
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    knownAt: timestamp("known_at"),
    knownFromId: text("known_from_id"),
    lastSeenAt: timestamp("last_seen_at"),
    seenCount: integer("seen_count").notNull().default(0),
    lastPracticedAt: timestamp("last_practiced_at"),
    practiceCount: integer("practice_count").notNull().default(0),
    seenCountSinceLastPracticed: integer("seen_count_since_last_practiced")
      .notNull()
      .default(0),
    nextPracticeAt: timestamp("next_practice_at"),
    spacedRepetitionStage: integer("spaced_repetition_stage")
      .notNull()
      .default(1),
  },
  (table) => ({
    uniqueIdx: unique().on(table.userId, table.wordId),
    createdFromIdIndex: index().on(table.createdFromId),
    knownFromIdIndex: index().on(table.knownFromId),
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
