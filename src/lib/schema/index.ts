import { boolean, integer, pgTable, primaryKey, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import type { AdapterAccount } from '@auth/core/adapters';

export const User = pgTable('user', {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  email: varchar('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  id: uuid('id').primaryKey().defaultRandom(),
  image: text('image'),
  isActive: boolean('is_active').notNull().default(true),
  name: varchar('name'),
});

export type UserSelect = typeof User.$inferSelect;
export type UserInsert = typeof User.$inferInsert;

export const Account = pgTable(
  'account',
  {
    access_token: text('access_token'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expires_at: integer('expires_at'),
    id_token: text('id_token'),
    provider: varchar('provider').notNull(),
    providerAccountId: varchar('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    scope: varchar('scope'),
    session_state: varchar('session_state'),
    token_type: varchar('token_type').$type<AdapterAccount['token_type']>(),
    type: varchar('type').$type<AdapterAccount['type']>().notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => User.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
  }),
);

export type AccountSelect = typeof Account.$inferSelect;
export type AccountInsert = typeof Account.$inferInsert;

export const Session = pgTable('session', {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expires: timestamp('expires').notNull(),
  sessionToken: text('session_token').notNull().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => User.id, { onDelete: 'cascade' }),
});

export type SessionSelect = typeof Session.$inferSelect;
export type SessionInsert = typeof Session.$inferInsert;

export const VerificationToken = pgTable(
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
