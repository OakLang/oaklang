import type { z } from "zod";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

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
  title: text("title"),
  sentenceIndex: integer("sentence_index").notNull().default(0),
  complexity: text("complexity", { enum: ["A1", "A2", "B1", "B2", "C1", "C2"] })
    .notNull()
    .default("A1"),
  languageCode: text("language_code")
    .notNull()
    .references(() => languages.code, { onDelete: "cascade" }),
});

export type TrainingSession = typeof trainingSessions.$inferSelect;

export const createTrainingSessionInput = createInsertSchema(
  trainingSessions,
).pick({
  title: true,
  complexity: true,
  languageCode: true,
});
export type CreateTrainingSessionInput = z.infer<
  typeof createTrainingSessionInput
>;

export const updateTrainingSessionInput = createInsertSchema(trainingSessions)
  .partial()
  .pick({
    title: true,
    complexity: true,
    sentenceIndex: true,
  });
export type UpdateTrainingSession = z.infer<typeof updateTrainingSessionInput>;
