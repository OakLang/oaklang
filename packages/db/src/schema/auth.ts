import type { AdapterAccountType } from "next-auth/adapters";
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { createPrefixedId } from "../utils";
import { userSettings } from "./user-settings";
import { userWords } from "./user-word";

export const userRole = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable("user", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createPrefixedId("user")),
  createdAt: timestamp().notNull().defaultNow(),
  name: text(),
  email: text().notNull(),
  emailVerified: timestamp(),
  image: text(),
  role: userRole().notNull().default("user"),
  isBlocked: boolean().notNull().default(false),
  isAllowedForTesting: boolean().notNull().default(false),
});
export type User = typeof users.$inferSelect;

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  authenticators: many(authenticators),
  practiceWords: many(userWords),
}));

export const accounts = pgTable(
  "account",
  {
    createdAt: timestamp().notNull().defaultNow(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text().$type<AdapterAccountType>().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refreshToken: text(),
    accessToken: text(),
    expiresAt: integer(),
    tokenType: text(),
    scope: text(),
    idToken: text(),
    sessionState: text(),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);
export type Account = typeof accounts.$inferSelect;

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessions = pgTable("session", {
  createdAt: timestamp().notNull().defaultNow(),
  sessionToken: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp().notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  userSettings: one(userSettings),
}));

export const verificationTokens = pgTable(
  "verification_token",
  {
    createdAt: timestamp().notNull().defaultNow(),
    identifier: text().notNull(),
    token: text().notNull(),
    expires: timestamp().notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  }),
);

export const authenticators = pgTable(
  "authenticator",
  {
    createdAt: timestamp().notNull().defaultNow(),
    credentialID: text().notNull().unique(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text().notNull(),
    credentialPublicKey: text().notNull(),
    counter: integer().notNull(),
    credentialDeviceType: text().notNull(),
    credentialBackedUp: boolean().notNull(),
    transports: text(),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  }),
);

export const authenticatorsRelations = relations(authenticators, ({ one }) => ({
  user: one(users, {
    fields: [authenticators.userId],
    references: [users.id],
  }),
}));
