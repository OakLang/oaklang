import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { createPrefixedId } from "../utils";
import { usersTable } from "./auth";
import { languagesTable } from "./language";
import { modulesTable } from "./module";

export const collectionsTable = pgTable("collection", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createPrefixedId("coll")),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  name: text("name").notNull(),
  description: text("description"),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  languageCode: text("language_code")
    .notNull()
    .references(() => languagesTable.code, { onDelete: "cascade" }),
});

export type Collection = typeof collectionsTable.$inferSelect;

export const collectionsRelations = relations(
  collectionsTable,
  ({ one, many }) => ({
    user: one(usersTable, {
      fields: [collectionsTable.userId],
      references: [usersTable.id],
    }),
    modules: many(modulesTable),
  }),
);
