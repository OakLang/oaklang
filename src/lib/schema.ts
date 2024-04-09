import { boolean, index, integer, pgTable, primaryKey, real, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import type { AdapterAccount } from '@auth/core/adapters';
import { relations } from 'drizzle-orm';

export const users = pgTable('user', {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  email: varchar('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  id: uuid('id').primaryKey().defaultRandom(),
  image: text('image'),
  isActive: boolean('is_active').notNull().default(true),
  name: varchar('name'),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  trainingSessions: many(trainingSessions),
}));

export type User = typeof users.$inferSelect;

export const accounts = pgTable(
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
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export type Account = typeof accounts.$inferSelect;

export const sessions = pgTable('session', {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expires: timestamp('expires').notNull(),
  sessionToken: text('session_token').notNull().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export type Session = typeof sessions.$inferSelect;

export const verificationTokens = pgTable(
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

export const verificationTokensRelations = relations(verificationTokens, () => ({}));

export type VerificationToken = typeof verificationTokens.$inferSelect;

export const trainingSessions = pgTable(
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
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    languageIdx: index().on(table.language),
  }),
);

export const trainingSessionsRelations = relations(trainingSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [trainingSessions.userId],
    references: [users.id],
  }),
  words: many(words),
}));

export type TrainingSession = typeof trainingSessions.$inferSelect;

export const words = pgTable(
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
      .references(() => trainingSessions.id, { onDelete: 'cascade' }),
    word: varchar('word').notNull(),
  },
  (table) => ({
    languageIdx: index().on(table.language),
    pk: primaryKey({ columns: [table.trainingSessionId, table.word] }),
  }),
);

export const wordsRelations = relations(words, ({ one }) => ({
  trainingSession: one(trainingSessions, {
    fields: [words.trainingSessionId],
    references: [trainingSessions.id],
  }),
}));

export type Word = typeof words.$inferSelect;
