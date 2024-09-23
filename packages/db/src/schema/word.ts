import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { createPrefixedId } from "../utils";
import { languages } from "./language";

export const words = pgTable(
  "word",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => createPrefixedId("word")),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    word: text("word").notNull(),
    languageCode: text("language_code")
      .notNull()
      .references(() => languages.code, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueIdx: unique().on(table.word, table.languageCode),
  }),
);
export type Word = typeof words.$inferSelect;
export type WordInsert = typeof words.$inferInsert;
