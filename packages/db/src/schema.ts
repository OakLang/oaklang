import type { AdapterAccountType } from "next-auth/adapters";
import type { z } from "zod";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

import type { GenerateSentenceObject } from "@acme/validators";

import { createPrefixedId } from "./utils";

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createPrefixedId("user")),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    createdAt: timestamp("created_at").notNull().defaultNow(),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
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

export const authenticators = pgTable(
  "authenticator",
  {
    createdAt: timestamp("created_at").notNull().defaultNow(),
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

export const languages = pgTable("language", {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  code: text("code").notNull().primaryKey(),
  name: text("name").notNull(),
});
export type Language = typeof languages.$inferSelect;

export const trainingSessions = pgTable("training_session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createPrefixedId("ts")),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sentenceIndex: integer("sentence_index").notNull().default(0),
  complexity: text("complexity", { enum: ["A1", "A2", "B1", "B2", "C1", "C2"] })
    .notNull()
    .default("A1"),
  helpLanguage: text("help_langauge")
    .notNull()
    .references(() => languages.code, { onDelete: "cascade" }),
  practiceLanguage: text("practice_language")
    .notNull()
    .references(() => languages.code, { onDelete: "cascade" }),
  sentencesCount: integer("sentences_count").notNull().default(5),
});

export type TrainingSession = typeof trainingSessions.$inferSelect;

export const createTrainingSessionInput = createInsertSchema(
  trainingSessions,
).pick({
  complexity: true,
  helpLanguage: true,
  practiceLanguage: true,
  sentencesCount: true,
});
export type CreateTrainingSessionInput = z.infer<
  typeof createTrainingSessionInput
>;

export const updateTrainingSessionInput = createInsertSchema(trainingSessions)
  .partial()
  .pick({
    complexity: true,
    helpLanguage: true,
    practiceLanguage: true,
    sentencesCount: true,
    sentenceIndex: true,
  });
export type UpdateTrainingSession = z.infer<typeof updateTrainingSessionInput>;

export const sentences = pgTable(
  "sentence",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createPrefixedId("sent")),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    trainingSessionId: text("training_session_id")
      .notNull()
      .references(() => trainingSessions.id, { onDelete: "cascade" }),
    sentence: text("sentence").notNull(),
    translation: text("translation").notNull(),
    words: jsonb("words")
      .notNull()
      .$type<GenerateSentenceObject["sentences"][number]["words"]>(),
    index: integer("index").notNull(),
  },
  (table) => ({
    uniqueIdx: unique().on(table.trainingSessionId, table.index),
  }),
);
export type Sentence = typeof sentences.$inferSelect;

export const words = pgTable(
  "word",
  {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    trainingSessionId: text("training_session_id")
      .notNull()
      .references(() => trainingSessions.id, { onDelete: "cascade" }),
    word: text("word").notNull(),
    isKnown: boolean("is_known").notNull().default(false),
    isPracticing: boolean("is_practicing").notNull().default(false),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.trainingSessionId, table.word],
    }),
  }),
);
export type Word = typeof words.$inferSelect;
