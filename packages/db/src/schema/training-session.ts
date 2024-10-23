import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { Exercises } from "@acme/core/constants";

import type { CreateTrainingSessoin, Exercise1FormData } from "../validators";
import { createPrefixedId } from "../utils";
import { usersTable } from "./auth";
import { languagesTable } from "./language";
import { sentencesTable } from "./sentence";
import { wordsTable } from "./word";

export const trainingSessionStatus = pgEnum("training_session_status", [
  "idle",
  "pending",
  "success",
  "error",
  "canceled",
]);

export const trainingSessionsTable = pgTable("training_session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createPrefixedId("ts")),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sentenceIndex: integer("sentence_index").notNull().default(0),
  languageCode: text("language_code")
    .notNull()
    .references(() => languagesTable.code, { onDelete: "cascade" }),
  exercise: text("exercise").notNull().default(Exercises.exercise1),
  data: jsonb("data")
    .notNull()
    .$type<CreateTrainingSessoin["data"]>()
    .default({
      complexity: "A1",
      topic: "",
      words: [],
    } satisfies Exercise1FormData["data"]),
  status: trainingSessionStatus("status").notNull().default("idle"),
});

export type TrainingSession = typeof trainingSessionsTable.$inferSelect;

export const trainingSessionsRelations = relations(
  trainingSessionsTable,
  ({ one, many }) => ({
    user: one(usersTable, {
      fields: [trainingSessionsTable.userId],
      references: [usersTable.id],
    }),
    langauge: one(languagesTable, {
      fields: [trainingSessionsTable.languageCode],
      references: [languagesTable.code],
    }),
    sentences: many(sentencesTable),
    trainingSessionWords: many(trainingSessionWordsTable),
  }),
);

export const trainingSessionWordsTable = pgTable(
  "training_session_word",
  {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    trainingSessionId: text("training_session_id")
      .notNull()
      .references(() => trainingSessionsTable.id, { onDelete: "cascade" }),
    wordId: text("word_id")
      .notNull()
      .references(() => wordsTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    compositePk: primaryKey({
      columns: [table.trainingSessionId, table.wordId],
    }),
  }),
);

export const trainingSessionWordsRelations = relations(
  trainingSessionWordsTable,
  ({ one }) => ({
    trainingSession: one(trainingSessionsTable, {
      fields: [trainingSessionWordsTable.trainingSessionId],
      references: [trainingSessionsTable.id],
    }),
    word: one(wordsTable, {
      fields: [trainingSessionWordsTable.wordId],
      references: [wordsTable.id],
    }),
  }),
);
