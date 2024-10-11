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

import { users } from "./auth";

export const accessRequestStatus = pgEnum("access_request_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const accessRequests = pgTable("access_request", {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: text("user_id")
    .notNull()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  status: accessRequestStatus("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by").references(() => users.id, {
    onDelete: "set null",
  }),
  reviewedAt: timestamp("reviewed_at"),
});

export const accessRequestsRelations = relations(accessRequests, ({ one }) => ({
  user: one(users, {
    fields: [accessRequests.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [accessRequests.reviewedBy],
    references: [users.id],
  }),
}));

export const accessRequestQuestions = pgTable("access_request_question", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  question: text("question").notNull(),
  isMultiChoice: boolean("is_multi_choice").notNull().default(false),
  order: integer("order").notNull().default(0),
});

export type AccessRequestQuestion = typeof accessRequestQuestions.$inferSelect;

export const accessRequestQuestionsRelations = relations(
  accessRequestQuestions,
  ({ many }) => ({
    options: many(accessRequestQuestionOptions),
  }),
);

export const accessRequestQuestionOptions = pgTable(
  "access_request_question_option",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => accessRequestQuestions.id, { onDelete: "cascade" }),
    option: text("option").notNull(),
    order: integer("order").notNull().default(0),
    isCustomAnswer: boolean("is_custom_answer").notNull().default(false),
    customAnswerPlaceholderText: text("custom_answer_placeholder_text"),
  },
);

export type AccessRequestQuestionOption =
  typeof accessRequestQuestionOptions.$inferSelect;

export const accessRequestQuestionOptionsRelations = relations(
  accessRequestQuestionOptions,
  ({ one }) => ({
    question: one(accessRequestQuestions, {
      fields: [accessRequestQuestionOptions.questionId],
      references: [accessRequestQuestions.id],
    }),
  }),
);

export const accessRequestUserResponses = pgTable(
  "access_request_user_response",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => accessRequestQuestions.id, { onDelete: "cascade" }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => accessRequestQuestionOptions.id, {
        onDelete: "cascade",
      }),
    customAnswer: text("custom_answer"),
  },
  (table) => ({
    uniqueIdx: unique().on(table.userId, table.questionId, table.optionId),
  }),
);

export type AccessRequestUserResponse =
  typeof accessRequestUserResponses.$inferSelect;

export const accessRequestUserResponsesRelations = relations(
  accessRequestUserResponses,
  ({ one }) => ({
    user: one(users, {
      fields: [accessRequestUserResponses.userId],
      references: [users.id],
    }),
    question: one(accessRequestQuestions, {
      fields: [accessRequestUserResponses.questionId],
      references: [accessRequestQuestions.id],
    }),
    option: one(accessRequestQuestionOptions, {
      fields: [accessRequestUserResponses.optionId],
      references: [accessRequestQuestionOptions.id],
    }),
  }),
);
