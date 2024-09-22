import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { COMPLEXITY_LIST } from "@acme/core/constants";

import { createPrefixedId } from "../utils";
import { users } from "./auth";
import { languages } from "./language";

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
});

export type TrainingSession = typeof trainingSessions.$inferSelect;
