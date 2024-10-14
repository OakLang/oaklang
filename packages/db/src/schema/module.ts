import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { COMPLEXITY_LIST } from "@acme/core/constants";

import { createPrefixedId } from "../utils";
import { usersTable } from "./auth";
import { collectionsTable } from "./collection";
import { languagesTable } from "./language";
import { wordsTable } from "./word";

export const modulesTable = pgTable("module", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createPrefixedId("mod")),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  name: text("name").notNull(),
  description: text("description"),
  collectionId: text("collection_id")
    .notNull()
    .references(() => collectionsTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  topic: text("topic"),
  complexity: text("complexity", { enum: COMPLEXITY_LIST })
    .notNull()
    .default("A1"),
  languageCode: text("language_code")
    .notNull()
    .references(() => languagesTable.code, { onDelete: "cascade" }),
});

export type Module = typeof modulesTable.$inferSelect;

export const modulesRelations = relations(modulesTable, ({ one, many }) => ({
  collection: one(collectionsTable, {
    fields: [modulesTable.collectionId],
    references: [collectionsTable.id],
  }),
  user: one(usersTable, {
    fields: [modulesTable.userId],
    references: [usersTable.id],
  }),
  words: many(moduleWordsTable),
}));

export const moduleWordsTable = pgTable("module_word", {
  moduleId: text("module_id")
    .notNull()
    .references(() => modulesTable.id, { onDelete: "cascade" }),
  wordId: text("word_id")
    .notNull()
    .references(() => wordsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ModuleWord = typeof moduleWordsTable.$inferSelect;

export const moduleWordsRelations = relations(moduleWordsTable, ({ one }) => ({
  module: one(modulesTable, {
    fields: [moduleWordsTable.moduleId],
    references: [modulesTable.id],
  }),
}));
