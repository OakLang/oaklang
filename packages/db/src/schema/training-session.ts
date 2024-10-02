import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { COMPLEXITY_LIST } from "@acme/core/constants";

import { createPrefixedId } from "../utils";
import { users } from "./auth";
import { languages } from "./language";
import { sentences } from "./sentence";

export const trainingSessions = pgTable("training_session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createPrefixedId("ts")),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sentenceIndex: integer("sentence_index").notNull().default(0),
  complexity: text("complexity", { enum: COMPLEXITY_LIST })
    .notNull()
    .default("A1"),
  languageCode: text("language_code")
    .notNull()
    .references(() => languages.code, { onDelete: "cascade" }),
  topic: text("topic"),
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
