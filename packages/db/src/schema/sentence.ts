import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import type { GenerateSentenceObject } from "@acme/validators";

import { createPrefixedId } from "../utils";
import { trainingSessions } from "./training";

export const sentences = pgTable(
  "sentence",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createPrefixedId("sent")),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    trainingSessionId: text("training_session_id")
      .notNull()
      .references(() => trainingSessions.id, { onDelete: "cascade" }),
    sentence: text("sentence").notNull(),
    translation: text("translation").notNull(),
    words: jsonb("words")
      .notNull()
      .$type<GenerateSentenceObject["sentences"][number]["words"]>(),
    index: integer("index").notNull(),
  },
  (table) => ({
    uniqueIdx: unique().on(table.trainingSessionId, table.index),
  }),
);
export type Sentence = typeof sentences.$inferSelect;
export type SentenceInsert = typeof sentences.$inferInsert;
