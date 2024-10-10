import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { COMPLEXITY_LIST } from "@acme/core/constants";

import { createPrefixedId } from "../utils";
import { users } from "./auth";
import { languages } from "./language";
import { sentences } from "./sentence";

export const trainingSessions = pgTable("training_session", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createPrefixedId("ts")),
  createdAt: timestamp().notNull().defaultNow(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text().notNull(),
  sentenceIndex: integer().notNull().default(0),
  complexity: text({ enum: COMPLEXITY_LIST }).notNull().default("A1"),
  languageCode: text()
    .notNull()
    .references(() => languages.code, { onDelete: "cascade" }),
  topic: text(),
});

export type TrainingSession = typeof trainingSessions.$inferSelect;

export const trainingSessionsRelations = relations(
  trainingSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [trainingSessions.userId],
      references: [users.id],
    }),
    langauge: one(languages, {
      fields: [trainingSessions.languageCode],
      references: [languages.code],
    }),
    sentences: many(sentences),
  }),
);
