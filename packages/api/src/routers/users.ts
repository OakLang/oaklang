import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { DB } from "@acme/db/client";
import type { User } from "@acme/db/schema";
import {
  APP_NAME,
  APP_URL,
  AUTH_REQUEST_EMAIL,
  NO_REPLY_EMAIL,
} from "@acme/core/constants";
import { and, eq } from "@acme/db";
import {
  accessRequestQuestionOptionsTable,
  accessRequestQuestionsTable,
  accessRequestsTable,
  accessRequestUserResponsesTable,
  practiceLanguagesTable,
  trainingSessionsTable,
  userSettingsTable,
  usersTable,
  userWordsTable,
} from "@acme/db/schema";
import { resend } from "@acme/email";
import AccessRequestReceived from "@acme/email/emails/access-request-received";
import AccessRequestSubmitted from "@acme/email/emails/access-request-submitted";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const usersRouter = createTRPCRouter({
  me: publicProcedure.query((opts) => {
    return opts.ctx.session?.user;
  }),
  deleteAccount: protectedProcedure.mutation(async (opts) => {
    await opts.ctx.db
      .delete(usersTable)
      .where(eq(usersTable.id, opts.ctx.session.user.id));
  }),
  resetAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.transaction(async (tx) => {
      await tx
        .delete(trainingSessionsTable)
        .where(eq(trainingSessionsTable.userId, ctx.session.user.id));
      await tx
        .delete(userWordsTable)
        .where(eq(userWordsTable.userId, ctx.session.user.id));
      await tx
        .delete(practiceLanguagesTable)
        .where(eq(practiceLanguagesTable.userId, ctx.session.user.id));
      await tx
        .delete(userSettingsTable)
        .where(eq(userSettingsTable.userId, ctx.session.user.id));
      await tx
        .insert(userSettingsTable)
        .values({ userId: ctx.session.user.id });
    });
  }),
  requestAccess: protectedProcedure
    .input(
      z.object({
        answers: z.object({}).catchall(
          z.object({
            options: z.array(
              z.object({
                id: z.string(),
                customAnswer: z.string().optional(),
              }),
            ),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [request] = await ctx.db
        .select()
        .from(accessRequestsTable)
        .where(eq(accessRequestsTable.userId, ctx.session.user.id));
      if (request) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You’ve already submitted a request for access! Our team is reviewing it, and we’ll notify you as soon as there’s an update. Thank you for your patience!",
        });
      }

      const questions = await ctx.db.select().from(accessRequestQuestionsTable);
      const userAnswers = questions
        .map((question) => {
          const answer = input.answers[question.id];
          if (!answer) {
            return null;
          }
          return answer.options.map(
            (option) =>
              ({
                questionId: question.id,
                userId: ctx.session.user.id,
                optionId: option.id,
                customAnswer: option.customAnswer,
              }) satisfies typeof accessRequestUserResponsesTable.$inferInsert,
          );
        })
        .filter((item) => !!item)
        .flatMap((options) => options);
      await ctx.db
        .delete(accessRequestUserResponsesTable)
        .where(eq(accessRequestUserResponsesTable.userId, ctx.session.user.id));
      await ctx.db.insert(accessRequestUserResponsesTable).values(userAnswers);
      await ctx.db
        .insert(accessRequestsTable)
        .values({ userId: ctx.session.user.id });

      const [user] = await ctx.db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, ctx.session.user.id));
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found!" });
      }

      const { error: accessRequestReceivedEmailError } =
        await resend.emails.send({
          from: NO_REPLY_EMAIL,
          to: user.email,
          subject: "Access Request Received - We’ll Get Back to You Soon!",
          react: AccessRequestReceived({
            title: "Access Request Received - We’ll Get Back to You Soon!",
            name:
              user.name ??
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              user.email.split("@")[0]!,
            appName: APP_NAME,
            appUrl: APP_URL,
            supportEmail: AUTH_REQUEST_EMAIL,
          }),
        });

      if (accessRequestReceivedEmailError) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: accessRequestReceivedEmailError.message,
        });
      }
      await sendRequestSubmittedEmailToReceivers(user, ctx.db);
    }),
});

const sendRequestSubmittedEmailToReceivers = async (user: User, db: DB) => {
  const adminUsers = await db
    .select({ email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.role, "admin"));

  const questions = await db.select().from(accessRequestQuestionsTable);

  const questionsAnswers = await Promise.all(
    questions.map(async (question) => {
      const answersWithOption = await db
        .select()
        .from(accessRequestUserResponsesTable)
        .innerJoin(
          accessRequestQuestionOptionsTable,
          eq(
            accessRequestQuestionOptionsTable.id,
            accessRequestUserResponsesTable.optionId,
          ),
        )
        .where(
          and(
            eq(accessRequestUserResponsesTable.questionId, question.id),
            eq(accessRequestUserResponsesTable.userId, user.id),
          ),
        );
      return {
        ...question,
        answers: answersWithOption.map((item) => ({
          ...item.access_request_user_response,
          option: item.access_request_question_option,
        })),
      };
    }),
  );

  const subject = `New Access Request Submitted by ${user.email}`;

  await resend.emails.send({
    from: NO_REPLY_EMAIL,
    to: adminUsers.map((user) => user.email),
    subject,
    react: AccessRequestSubmitted({
      agreedToPrivacyPolicy: true,
      agreedToTermsOfServices: true,
      submittedOn: new Date(),
      title: subject,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      appName: APP_NAME,
      appUrl: APP_URL,
      questionsAnswers,
    }),
  });
};
