import { relations } from "drizzle-orm";
import {
  boolean,
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
    createdAt: timestamp().notNull().defaultNow(),
    createdFromId: text(),
    wordId: text()
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    knownAt: timestamp(),
    knownFromId: text(),
    lastSeenAt: timestamp(),
    seenCount: integer().notNull().default(0),
    lastPracticedAt: timestamp(),
    practiceCount: integer().notNull().default(0),
    seenCountSinceLastPracticed: integer().notNull().default(0),
    nextPracticeAt: timestamp(),
    spacedRepetitionStage: integer().notNull().default(1),
    hideLines: boolean().notNull().default(false),
    markedUnknownCount: integer().notNull().default(0),
    lastMarkedUnknownAt: timestamp(),
    dissableHideLinesCount: integer().notNull().default(0),
    lastDissabledHideLinesAt: timestamp(),
  },
  (table) => ({
    uniqueIdx: unique().on(table.userId, table.wordId),
    createdFromIdIndex: index().on(table.createdFromId),
    knownFromIdIndex: index().on(table.knownFromId),
  }),
);

export type UserWord = typeof userWords.$inferSelect;

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
