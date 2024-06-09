import { boolean, integer, pgTable, primaryKey, real, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
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
  lexiconSeens: many(lexiconSeensTable),
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
  languageId: varchar('language_id')
    .notNull()
    .default('en')
    .references(() => languagesTable.id, { onDelete: 'set default' }),
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
  languageId: varchar('language_id')
    .notNull()
    .default('en')
    .references(() => languagesTable.id, { onDelete: 'set default' }),
  numberOfLexiconsToTrain: integer('number_of_lexicons_to_train').notNull(),
  numberOfTimesToRepeat: integer('number_of_times_to_repeat').notNull(),
  numberOfTimesToTrain: integer('number_of_times_to_train').notNull(),
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
  lexicons: many(lexiconsTable),
  user: one(usersTable, {
    fields: [trainingSessionsTable.userId],
    references: [usersTable.id],
  }),
}));

export type TrainingSession = typeof trainingSessionsTable.$inferSelect;

export const lexiconsTable = pgTable(
  'lexicon',
  {
    comprehensionProb: integer('comprehension_prob').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    id: uuid('id').primaryKey().defaultRandom(),
    languageId: varchar('language_id')
      .notNull()
      .default('en')
      .references(() => languagesTable.id, { onDelete: 'set default' }),
    lexicon: varchar('lexicon').notNull(),
    markedKnown: boolean('marked_known').notNull().default(false),
    productionProb: integer('production_prob').notNull().default(0),
    repetitions: integer('repetitions').notNull().default(0),
    trainingSessionId: uuid('training_session_id')
      .notNull()
      .references(() => trainingSessionsTable.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    uniqueIdx: uniqueIndex().on(table.trainingSessionId, table.lexicon),
  }),
);

export const lexiconsRelations = relations(lexiconsTable, ({ one, many }) => ({
  language: one(languagesTable, {
    fields: [lexiconsTable.languageId],
    references: [languagesTable.id],
  }),
  seens: many(lexiconSeensTable),
  trainingSession: one(trainingSessionsTable, {
    fields: [lexiconsTable.trainingSessionId],
    references: [trainingSessionsTable.id],
  }),
}));

export type Lexicon = typeof lexiconsTable.$inferSelect;

export const lexiconSeensTable = pgTable('lexicon_seen', {
  id: uuid('id').primaryKey().defaultRandom(),
  lexiconId: uuid('lexicon_id')
    .notNull()
    .references(() => lexiconsTable.id, { onDelete: 'cascade' }),
  seenAt: timestamp('created_at').notNull().defaultNow(),
  seenById: uuid('seen_by_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
});

export const lexiconSeensRelations = relations(lexiconSeensTable, ({ one }) => ({
  lexicon: one(lexiconsTable, {
    fields: [lexiconSeensTable.lexiconId],
    references: [lexiconsTable.id],
  }),
  seenBy: one(usersTable, {
    fields: [lexiconSeensTable.seenById],
    references: [usersTable.id],
  }),
}));

export type LexiconSeen = typeof lexiconSeensTable.$inferSelect;

export const languagesTable = pgTable('language', {
  id: varchar('id').primaryKey(), // ISO 639-1 Code
  isActive: boolean('is_active').notNull().default(true),
  name: varchar('name').notNull(),
  nativeName: varchar('native_name').notNull(),
});

export const languagesRelations = relations(languagesTable, ({ many }) => ({
  lexicons: many(lexiconsTable),
  trainingSessions: many(trainingSessionsTable),
}));

export type Language = typeof languagesTable.$inferSelect;
