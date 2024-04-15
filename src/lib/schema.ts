import { boolean, index, integer, pgTable, primaryKey, real, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
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

export const usersRelations = relations(usersTable, ({ many }) => ({
  accounts: many(accountsTable),
  trainingSessions: many(trainingSessionsTable),
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

export const trainingSessionsTable = pgTable(
  'training_session',
  {
    createdAt: timestamp('created_at').notNull().defaultNow(),
    id: uuid('id').primaryKey().defaultRandom(),
    language: varchar('language').notNull(),
    numberOfTimesToRepeat: integer('number_of_times_to_repeat').notNull(),
    numberOfTimesToTrain: integer('number_of_times_to_train').notNull(),
    numberOfWordsToTrain: integer('number_of_words_to_train').notNull(),
    percentKnown: real('percent_known').notNull(),
    relatedPrecursor: boolean('related_precursor').notNull(),
    sentenceLength: integer('sentence_length'),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    languageIdx: index().on(table.language),
  }),
);

export const trainingSessionsRelations = relations(trainingSessionsTable, ({ one, many }) => ({
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
    language: varchar('language').notNull(),
    markedKnown: boolean('marked_known').notNull().default(false),
    productionProb: integer('production_prob').notNull().default(0),
    repetitions: integer('repetitions').notNull().default(0),
    trainingSessionId: uuid('training_session_id')
      .notNull()
      .references(() => trainingSessionsTable.id, { onDelete: 'cascade' }),
    word: varchar('word').notNull(),
  },
  (table) => ({
    languageIdx: index().on(table.language),
    pk: primaryKey({ columns: [table.trainingSessionId, table.word] }),
  }),
);

export const wordsRelations = relations(wordsTable, ({ one }) => ({
  trainingSession: one(trainingSessionsTable, {
    fields: [wordsTable.trainingSessionId],
    references: [trainingSessionsTable.id],
  }),
}));

export type Word = typeof wordsTable.$inferSelect;
