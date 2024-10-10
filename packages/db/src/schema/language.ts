import { relations } from "drizzle-orm";
import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

import { users } from "./auth";
import { trainingSessions } from "./training-session";
import { userSettings } from "./user-settings";
import { words } from "./word";

export const languages = pgTable("language", {
  // ISO 639
  code: text().notNull().primaryKey(),
  // ISO 3166-1 A-2
  countryCode: text().notNull(),
  name: text().notNull(),
});

export type Language = typeof languages.$inferSelect;
export type LanguageInsert = typeof languages.$inferInsert;

export const languagesRelations = relations(languages, ({ many }) => ({
  words: many(words),
  trainingSessions: many(trainingSessions),
  practiceLanguages: many(practiceLanguages),
  userSettings: many(userSettings),
}));

export const practiceLanguages = pgTable(
  "practice_language",
  {
    createdAt: timestamp().notNull().defaultNow(),
    lastPracticed: timestamp().notNull().defaultNow(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    languageCode: text()
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

export const practiceLanguagesRelations = relations(
  practiceLanguages,
  ({ one }) => ({
    user: one(users, {
      fields: [practiceLanguages.userId],
      references: [users.id],
    }),
    language: one(languages, {
      fields: [practiceLanguages.languageCode],
      references: [languages.code],
    }),
  }),
);
