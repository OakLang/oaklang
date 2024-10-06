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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: text("user_id")
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
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  question: text("question").notNull(),
  isMultiChoice: boolean("is_multi_choice").notNull().default(false),
  order: integer("order").notNull().default(0),
});

export type AccessRequestQuestion = typeof accessRequestQuestions.$inferSelect;

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
