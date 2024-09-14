import { pgTable, text } from "drizzle-orm/pg-core";

export const languages = pgTable("language", {
  // ISO 639
  code: text("code").notNull().primaryKey(),
  // ISO 3166-1 A-2
  countryCode: text("country_code").notNull(),
  name: text("name").notNull(),
});

export type Language = typeof languages.$inferSelect;
export type LanguageInsert = typeof languages.$inferInsert;
