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
import { accessRequestUserResponsesTable } from "./access-request";
import { userSettingsTable } from "./user-settings";
import { userWordsTable } from "./user-word";

export const userRole = pgEnum("user_role", ["user", "power", "admin"]);
export type UserRole = (typeof userRole.enumValues)[number];

export const usersTable = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createPrefixedId("user")),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  role: userRole("role").notNull().default("user"),
  isBlocked: boolean("is_blocked").notNull().default(false),
});
export type User = typeof usersTable.$inferSelect;

export const usersRelations = relations(usersTable, ({ many, one }) => ({
  userSettings: one(userSettingsTable),
  accounts: many(accountsTable),
  sessions: many(sessionsTable),
  authenticators: many(authenticatorsTable),
  practiceWords: many(userWordsTable),
  accessRequestUserResponses: many(accessRequestUserResponsesTable),
}));

export const accountsTable = pgTable(
  "account",
  {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);
export type Account = typeof accountsTable.$inferSelect;

export const accountsRelations = relations(accountsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [accountsTable.userId],
    references: [usersTable.id],
  }),
}));

export const sessionsTable = pgTable("session", {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  }),
}));

export const verificationTokensTable = pgTable(
  "verification_token",
  {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  }),
);

export const authenticatorsTable = pgTable(
  "authenticator",
  {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    credentialID: text("credential_id").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    providerAccountId: text("provider_account_id").notNull(),
    credentialPublicKey: text("credential_public_key").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credential_device_type").notNull(),
    credentialBackedUp: boolean("credential_backed_up").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  }),
);

export const authenticatorsRelations = relations(
  authenticatorsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [authenticatorsTable.userId],
      references: [usersTable.id],
    }),
  }),
);
