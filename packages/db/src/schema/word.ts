import {
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { users } from "./auth";

export const words = pgTable(
  "word",
  {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    word: text("word").notNull(),
    isKnown: boolean("is_known").notNull().default(false),
    isPracticing: boolean("is_practicing").notNull().default(false),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.userId, table.word],
    }),
  }),
);
export type Word = typeof words.$inferSelect;
export type WordInsert = typeof words.$inferInsert;
