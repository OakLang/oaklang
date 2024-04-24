import { boolean, integer, pgTable, primaryKey, real, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import type { AdapterAccount } from '@auth/core/adapters';
import { relations } from 'drizzle-orm';

export const usersTable = pgTable('user', {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  email: varchar('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  id: uuid('id').primaryKey().defaultRandom(),
  image: text('image'),
  isActive: boolean('is_active').notNull().default(true),
  name: varchar('name'),
});

export const usersRelations = relations(usersTable, ({ many, one }) => ({
  accounts: many(accountsTable),
  trainingSessions: many(trainingSessionsTable),
  userPreference: one(userPreferencesTable, {
    fields: [usersTable.id],
    references: [userPreferencesTable.userId],
  }),
}));

export type User = typeof usersTable.$inferSelect;

export const accountsTable = pgTable(
  'account',
  {
    accessToken: text('access_token'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expiresAt: integer('expires_at'),
    idToken: text('id_token'),
    provider: varchar('provider').notNull(),
    providerAccountId: varchar('provider_account_id').notNull(),
    refreshToken: text('refresh_token'),
    scope: varchar('scope'),
    sessionState: varchar('session_state'),
    tokenType: varchar('token_type').$type<AdapterAccount['token_type']>(),
    type: varchar('type').$type<AdapterAccount['type']>().notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
  }),
);

export const accountsRelations = relations(accountsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [accountsTable.userId],
    references: [usersTable.id],
  }),
}));

export type Account = typeof accountsTable.$inferSelect;

export const sessionsTable = pgTable('session', {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expires: timestamp('expires').notNull(),
  sessionToken: text('session_token').notNull().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
});

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  }),
}));

export type Session = typeof sessionsTable.$inferSelect;

export const verificationTokensTable = pgTable(
  'verification_token',
  {
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expires: timestamp('expires').notNull(),
    identifier: varchar('identifier').notNull(),
    token: text('token').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token] }),
  }),
);

export const verificationTokensRelations = relations(verificationTokensTable, () => ({}));

export type VerificationToken = typeof verificationTokensTable.$inferSelect;

export const userPreferencesTable = pgTable('user_preference', {
  languageId: varchar('language_id').references(() => languagesTable.id, { onDelete: 'set null' }),
  userId: uuid('user_id')
    .primaryKey()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
});

export const userPreferencesRelations = relations(userPreferencesTable, ({ one }) => ({
  language: one(languagesTable, {
    fields: [userPreferencesTable.languageId],
    references: [languagesTable.id],
  }),
  user: one(usersTable, {
    fields: [userPreferencesTable.userId],
    references: [usersTable.id],
  }),
}));

export type UserPreference = typeof userPreferencesTable.$inferSelect;

export const trainingSessionsTable = pgTable('training_session', {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  id: uuid('id').primaryKey().defaultRandom(),
  languageId: varchar('language_id').references(() => languagesTable.id, { onDelete: 'set null' }),
  numberOfTimesToRepeat: integer('number_of_times_to_repeat').notNull(),
  numberOfTimesToTrain: integer('number_of_times_to_train').notNull(),
  numberOfWordsToTrain: integer('number_of_words_to_train').notNull(),
  percentKnown: real('percent_known').notNull(),
  relatedPrecursor: boolean('related_precursor').notNull(),
  sentenceLength: integer('sentence_length'),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
});

export const trainingSessionsRelations = relations(trainingSessionsTable, ({ one, many }) => ({
  language: one(languagesTable, {
    fields: [trainingSessionsTable.languageId],
    references: [languagesTable.id],
  }),
  user: one(usersTable, {
    fields: [trainingSessionsTable.userId],
    references: [usersTable.id],
  }),
  words: many(wordsTable),
}));

export type TrainingSession = typeof trainingSessionsTable.$inferSelect;

export const wordsTable = pgTable(
  'word',
  {
    comprehensionProb: integer('comprehension_prob').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    languageId: varchar('language_id')
      .notNull()
      .references(() => languagesTable.id),
    markedKnown: boolean('marked_known').notNull().default(false),
    productionProb: integer('production_prob').notNull().default(0),
    repetitions: integer('repetitions').notNull().default(0),
    trainingSessionId: uuid('training_session_id')
      .notNull()
      .references(() => trainingSessionsTable.id, { onDelete: 'cascade' }),
    word: varchar('word').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.trainingSessionId, table.word] }),
  }),
);

export const wordsRelations = relations(wordsTable, ({ one }) => ({
  language: one(languagesTable, {
    fields: [wordsTable.languageId],
    references: [languagesTable.id],
  }),
  trainingSession: one(trainingSessionsTable, {
    fields: [wordsTable.trainingSessionId],
    references: [trainingSessionsTable.id],
  }),
}));

export type Word = typeof wordsTable.$inferSelect;

export const languagesTable = pgTable('language', {
  id: varchar('id').primaryKey(), // ISO 639-1 Code
  isActive: boolean('is_active').notNull().default(true),
  name: varchar('name').notNull(),
  nativeName: varchar('native_name').notNull(),
});

export const languagesRelations = relations(languagesTable, ({ many }) => ({
  trainingSessions: many(trainingSessionsTable),
  words: many(wordsTable),
}));

export type Language = typeof languagesTable.$inferSelect;
