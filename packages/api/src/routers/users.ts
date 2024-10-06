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
  accessRequestQuestionOptions,
  accessRequestQuestions,
  accessRequests,
  accessRequestUserResponses,
  practiceLanguages,
  trainingSessions,
  users,
  userSettings,
  userWords,
} from "@acme/db/schema";
import { resend } from "@acme/email";
import AccessRequestReceived from "@acme/email/emails/access-request-received";
import AccessRequestSubmitted from "@acme/email/emails/access-request-submitted";

import { env } from "../env";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const usersRouter = createTRPCRouter({
  me: publicProcedure.query((opts) => {
    return opts.ctx.session?.user;
  }),
  deleteAccount: protectedProcedure.mutation(async (opts) => {
    await opts.ctx.db
      .delete(users)
      .where(eq(users.id, opts.ctx.session.user.id));
  }),
  resetAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.transaction(async (tx) => {
      await tx
        .delete(trainingSessions)
        .where(eq(trainingSessions.userId, ctx.session.user.id));
      await tx
        .delete(userWords)
        .where(eq(userWords.userId, ctx.session.user.id));
      await tx
        .delete(practiceLanguages)
        .where(eq(practiceLanguages.userId, ctx.session.user.id));
      await tx
        .delete(userSettings)
        .where(eq(userSettings.userId, ctx.session.user.id));
      await tx.insert(userSettings).values({ userId: ctx.session.user.id });
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
        .from(accessRequests)
        .where(eq(accessRequests.userId, ctx.session.user.id));
      if (request) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You’ve already submitted a request for access! Our team is reviewing it, and we’ll notify you as soon as there’s an update. Thank you for your patience!",
        });
      }

      const questions = await ctx.db.select().from(accessRequestQuestions);
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
              }) satisfies typeof accessRequestUserResponses.$inferInsert,
          );
        })
        .filter((item) => !!item)
        .flatMap((options) => options);
      await ctx.db
        .delete(accessRequestUserResponses)
        .where(eq(accessRequestUserResponses.userId, ctx.session.user.id));
      await ctx.db.insert(accessRequestUserResponses).values(userAnswers);
      await ctx.db
        .insert(accessRequests)
        .values({ userId: ctx.session.user.id });

      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, ctx.session.user.id));
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found!" });
      }

      const { error: accessRequestReceivedEmailError } =
        await resend.emails.send({
          from: `${APP_NAME} <${NO_REPLY_EMAIL}>`,
          to: user.email,
          subject: "Access Request Received - We’ll Get Back to You Soon!",
          react: AccessRequestReceived({
            title: "Access Request Received - We’ll Get Back to You Soon!",
            name: user.name ?? user.email,
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
      await sendRequestSubmittedEmailToReceivers({ db: ctx.db, user });
    }),
  testReceiverEmail: protectedProcedure.mutation(async ({ ctx }) => {
    const [user] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.session.user.id));
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found!" });
    }
    await sendRequestSubmittedEmailToReceivers({ db: ctx.db, user });
  }),
});

const sendRequestSubmittedEmailToReceivers = async ({
  db,
  user,
}: {
  db: DB;
  user: User;
}) => {
  const accessRequestReceivers = env.ACCESS_REQUEST_RECEIVERS.split(",").map(
    (email) => email.trim(),
  );
  console.log({ accessRequestReceivers });
  const questions = await db.select().from(accessRequestQuestions);

  const questionsAnswers = await Promise.all(
    questions.map(async (question) => {
      const answersWithOption = await db
        .select()
        .from(accessRequestUserResponses)
        .innerJoin(
          accessRequestQuestionOptions,
          eq(
            accessRequestQuestionOptions.id,
            accessRequestUserResponses.optionId,
          ),
        )
        .where(
          and(
            eq(accessRequestUserResponses.questionId, question.id),
            eq(accessRequestUserResponses.userId, user.id),
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

  console.log(questionsAnswers);

  await resend.emails.send({
    from: `${APP_NAME} <${NO_REPLY_EMAIL}>`,
    to: accessRequestReceivers,
    subject: `New Access Request Submitted by ${user.email}`,
    react: AccessRequestSubmitted({
      agreedToPrivacyPolicy: true,
      agreedToTermsOfServices: true,
      submittedOn: new Date(),
      title: `New Access Request Submitted by ${user.email}`,
      user,
      appName: APP_NAME,
      appUrl: APP_URL,
      questionsAnswers,
    }),
  });
};
