import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./auth";

export const accessRequests = pgTable("access_request", {
  createdAt: timestamp().notNull().defaultNow(),
  userId: text()
    .notNull()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accessRequestsRelations = relations(accessRequests, ({ one }) => ({
  user: one(users, {
    fields: [accessRequests.userId],
    references: [users.id],
  }),
}));

export const accessRequestQuestions = pgTable("access_request_question", {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp().notNull().defaultNow(),
  question: text().notNull(),
  isMultiChoice: boolean().notNull().default(false),
  order: integer().notNull().default(0),
});

export type AccessRequestQuestion = typeof accessRequestQuestions.$inferSelect;

export const accessRequestQuestionOptions = pgTable(
  "access_request_question_option",
  {
    id: uuid().primaryKey().defaultRandom(),
    createdAt: timestamp().notNull().defaultNow(),
    questionId: uuid()
      .notNull()
      .references(() => accessRequestQuestions.id, { onDelete: "cascade" }),
    option: text().notNull(),
    order: integer().notNull().default(0),
    isCustomAnswer: boolean().notNull().default(false),
    customAnswerPlaceholderText: text(),
  },
);

export type AccessRequestQuestionOption =
  typeof accessRequestQuestionOptions.$inferSelect;

export const accessRequestUserResponses = pgTable(
  "access_request_user_response",
  {
    id: uuid().primaryKey().defaultRandom(),
    createdAt: timestamp().notNull().defaultNow(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionId: uuid()
      .notNull()
      .references(() => accessRequestQuestions.id, { onDelete: "cascade" }),
    optionId: uuid()
      .notNull()
      .references(() => accessRequestQuestionOptions.id, {
        onDelete: "cascade",
      }),
    customAnswer: text(),
  },
  (table) => ({
    uniqueIdx: unique().on(table.userId, table.questionId, table.optionId),
  }),
);

export type AccessRequestUserResponse =
  typeof accessRequestUserResponses.$inferSelect;
