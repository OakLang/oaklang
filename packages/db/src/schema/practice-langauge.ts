import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

import { users } from "./auth";
import { languages } from "./language";

export const practiceLanguages = pgTable(
  "practice_langauge",
  {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastPracticed: timestamp("last_practiced").notNull().defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    langauge: text("language")
      .notNull()
      .references(() => languages.code, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.userId, table.langauge],
    }),
  }),
);

export type PracticeLanguage = typeof practiceLanguages.$inferSelect;
export type PracticeLanguageInsert = typeof practiceLanguages.$inferInsert;
