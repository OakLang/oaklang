import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

import { users } from "./auth";

export const languages = pgTable("language", {
  // ISO 639
  code: text("code").notNull().primaryKey(),
  // ISO 3166-1 A-2
  countryCode: text("country_code").notNull(),
  name: text("name").notNull(),
});

export type Language = typeof languages.$inferSelect;
export type LanguageInsert = typeof languages.$inferInsert;

export const practiceLanguages = pgTable(
  "practice_language",
  {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastPracticed: timestamp("last_practiced").notNull().defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    languageCode: text("language_code")
      .notNull()
      .references(() => languages.code, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.userId, table.languageCode],
    }),
  }),
);

export type PracticeLanguage = typeof practiceLanguages.$inferSelect;
export type PracticeLanguageInsert = typeof practiceLanguages.$inferInsert;
