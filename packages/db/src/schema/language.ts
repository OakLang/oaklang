import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const languages = pgTable("language", {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  code: text("code").notNull().primaryKey(),
  name: text("name").notNull(),
});

export type Language = typeof languages.$inferSelect;
export type LanguageInsert = typeof languages.$inferInsert;
