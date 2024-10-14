import { relations } from "drizzle-orm";
import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

import { usersTable } from "./auth";
import { trainingSessionsTable } from "./training-session";
import { userSettingsTable } from "./user-settings";
import { wordsTable } from "./word";

export const languagesTable = pgTable("language", {
  // ISO 639
  code: text("code").notNull().primaryKey(),
  // ISO 3166-1 A-2
  countryCode: text("country_code").notNull(),
  name: text("name").notNull(),
});

export type Language = typeof languagesTable.$inferSelect;
export type LanguageInsert = typeof languagesTable.$inferInsert;

export const languagesRelations = relations(languagesTable, ({ many }) => ({
  words: many(wordsTable),
  trainingSessions: many(trainingSessionsTable),
  practiceLanguages: many(practiceLanguagesTable),
  userSettings: many(userSettingsTable),
}));

export const practiceLanguagesTable = pgTable(
  "practice_language",
  {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastPracticed: timestamp("last_practiced").notNull().defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    languageCode: text("language_code")
      .notNull()
      .references(() => languagesTable.code, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.userId, table.languageCode],
    }),
  }),
);

export type PracticeLanguage = typeof practiceLanguagesTable.$inferSelect;
export type PracticeLanguageInsert = typeof practiceLanguagesTable.$inferInsert;

export const practiceLanguagesRelations = relations(
  practiceLanguagesTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [practiceLanguagesTable.userId],
      references: [usersTable.id],
    }),
    language: one(languagesTable, {
      fields: [practiceLanguagesTable.languageCode],
      references: [languagesTable.code],
    }),
  }),
);
