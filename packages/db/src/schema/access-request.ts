import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { usersTable } from "./auth";

export const accessRequestStatus = pgEnum("access_request_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const accessRequestsTable = pgTable("access_request", {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: text("user_id")
    .notNull()
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  status: accessRequestStatus("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  reviewedAt: timestamp("reviewed_at"),
});

export const accessRequestsRelations = relations(
  accessRequestsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [accessRequestsTable.userId],
      references: [usersTable.id],
    }),
    reviewer: one(usersTable, {
      fields: [accessRequestsTable.reviewedBy],
      references: [usersTable.id],
    }),
  }),
);

export const accessRequestQuestionsTable = pgTable("access_request_question", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  question: text("question").notNull(),
  isMultiChoice: boolean("is_multi_choice").notNull().default(false),
  order: integer("order").notNull().default(0),
});

export type AccessRequestQuestion =
  typeof accessRequestQuestionsTable.$inferSelect;

export const accessRequestQuestionsRelations = relations(
  accessRequestQuestionsTable,
  ({ many }) => ({
    options: many(accessRequestQuestionOptionsTable),
  }),
);

export const accessRequestQuestionOptionsTable = pgTable(
  "access_request_question_option",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => accessRequestQuestionsTable.id, {
        onDelete: "cascade",
      }),
    option: text("option").notNull(),
    order: integer("order").notNull().default(0),
    isCustomAnswer: boolean("is_custom_answer").notNull().default(false),
    customAnswerPlaceholderText: text("custom_answer_placeholder_text"),
  },
);

export type AccessRequestQuestionOption =
  typeof accessRequestQuestionOptionsTable.$inferSelect;

export const accessRequestQuestionOptionsRelations = relations(
  accessRequestQuestionOptionsTable,
  ({ one }) => ({
    question: one(accessRequestQuestionsTable, {
      fields: [accessRequestQuestionOptionsTable.questionId],
      references: [accessRequestQuestionsTable.id],
    }),
  }),
);

export const accessRequestUserResponsesTable = pgTable(
  "access_request_user_response",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => accessRequestQuestionsTable.id, {
        onDelete: "cascade",
      }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => accessRequestQuestionOptionsTable.id, {
        onDelete: "cascade",
      }),
    customAnswer: text("custom_answer"),
  },
  (table) => ({
    uniqueIdx: unique().on(table.userId, table.questionId, table.optionId),
  }),
);

export type AccessRequestUserResponse =
  typeof accessRequestUserResponsesTable.$inferSelect;

export const accessRequestUserResponsesRelations = relations(
  accessRequestUserResponsesTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [accessRequestUserResponsesTable.userId],
      references: [usersTable.id],
    }),
    question: one(accessRequestQuestionsTable, {
      fields: [accessRequestUserResponsesTable.questionId],
      references: [accessRequestQuestionsTable.id],
    }),
    option: one(accessRequestQuestionOptionsTable, {
      fields: [accessRequestUserResponsesTable.optionId],
      references: [accessRequestQuestionOptionsTable.id],
    }),
  }),
);
