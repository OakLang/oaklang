import type { BadgeExplanation, GitHubUser, TimelineTemplate } from '~/utils/types';
/* eslint-disable max-lines */
import {
  bigint,
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';

import type { InferSelectModel } from 'drizzle-orm';
import { addHours } from 'date-fns';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';

export const citext = customType<{ data: string }>({
  dataType() {
    return 'citext';
  },
});

export const User = pgTable(
  'User',
  {
    bio: varchar('bio'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    id: varchar('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    isActive: boolean('isActive').notNull().default(true),
    sessionId: varchar('sessionId')
      .notNull()
      .unique()
      .$defaultFn(() => createId()),
    fullName: varchar('fullName'),
  },
);

export const usersRelations = relations(User, ({ many }) => ({
  auditLogs: many(AuditLog),
}));

export const AuditLog = pgTable(
  'AuditLog',
  {
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    event: varchar('event').notNull(),
    id: varchar('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    ip: varchar('ip'),
    metadata: jsonb('metadata').notNull().default('{}'),
    userAgent: varchar('userAgent'),
    userId: varchar('userId')
      .notNull()
      .references(() => User.id),
  },
  (table) => {
    return {
      userIdCreatedAtDescIdx: index().on(table.userId, table.createdAt).desc(),
      userIdIdx: index().on(table.userId),
    };
  },
);

export const auditLogRelations = relations(AuditLog, ({ one }) => ({
  user: one(User, {
    fields: [AuditLog.userId],
    references: [User.id],
  }),
}));
