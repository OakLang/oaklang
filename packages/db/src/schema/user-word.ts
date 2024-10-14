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

import { usersTable } from "./auth";
import { wordsTable } from "./word";

export const userWordsTable = pgTable(
  "user_word",
  {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdFromId: text("created_from_id"),
    wordId: text("word_id")
      .notNull()
      .references(() => wordsTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
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
    hideLines: boolean("hide_lines").notNull().default(false),
    markedUnknownCount: integer("marked_unknown_count").notNull().default(0),
    lastMarkedUnknownAt: timestamp("last_marked_unknown_at"),
    dissableHideLinesCount: integer("dissable_hide_lines_count")
      .notNull()
      .default(0),
    lastDissabledHideLinesAt: timestamp("last_dissabled_hide_lines_at"),
  },
  (table) => ({
    uniqueIdx: unique().on(table.userId, table.wordId),
    createdFromIdIndex: index().on(table.createdFromId),
    knownFromIdIndex: index().on(table.knownFromId),
  }),
);

export type UserWord = typeof userWordsTable.$inferSelect;

export const practiceWordsRelations = relations(userWordsTable, ({ one }) => ({
  word: one(wordsTable, {
    fields: [userWordsTable.wordId],
    references: [wordsTable.id],
  }),
  user: one(usersTable, {
    fields: [userWordsTable.userId],
    references: [usersTable.id],
  }),
}));
