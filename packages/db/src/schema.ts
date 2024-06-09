import type { AdapterAccountType } from "next-auth/adapters";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { prefixedKSUID } from "./utils";

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => prefixedKSUID("user")),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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

export const sessions = pgTable("session", {
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
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

export const authenticators = pgTable(
  "authenticator",
  {
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    credentialID: text("credential_id").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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

export const teams = pgTable("team", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => prefixedKSUID("team")),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  name: text("name"),
  slug: text("slug").notNull().unique(),
});

export const teamMemberRole = pgEnum("team_member_role", ["owner", "member"]);

export const teamMembers = pgTable(
  "team_member",
  {
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    role: teamMemberRole("role").notNull().default("member"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
  },
  (teamMember) => ({
    compoundKey: primaryKey({
      columns: [teamMember.teamId, teamMember.userId],
    }),
  }),
);
