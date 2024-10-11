import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  APP_NAME,
  APP_URL,
  NO_REPLY_EMAIL,
  SUPPORT_EMAIL,
} from "@acme/core/constants";
import { and, count, desc, eq } from "@acme/db";
import {
  accessRequestQuestionOptions,
  accessRequestQuestions,
  accessRequests,
  accessRequestUserResponses,
  users,
} from "@acme/db/schema";
import { resend } from "@acme/email";
import AccessRequestAccepted from "@acme/email/emails/access-request-accepted";
import AccessRequestRejected from "@acme/email/emails/access-request-rejected";

import { adminProcedure, createTRPCRouter } from "../../trpc";
import { paginationBaseSchema } from "../../validators";

export const usersRouter = createTRPCRouter({
  getUsers: adminProcedure
    .input(paginationBaseSchema)
    .query(async ({ ctx, input: { size, page } }) => {
      const offset = (page - 1) * size;

      const list = await ctx.db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(size)
        .offset(offset);

      const totalRows = await ctx.db.select({ count: count() }).from(users);

      const totalRowsCount = totalRows[0]?.count ?? 0;

      let nextPage: number | null = null;
      if (offset + size < totalRowsCount) {
        nextPage = page + 1;
      }

      return {
        list,
        previousPage: page > 1 ? page - 1 : null,
        nextPage,
        page,
        limit: size,
        total: totalRowsCount,
      };
    }),

  getAccessRequests: adminProcedure
    .input(
      paginationBaseSchema.extend({
        status: z
          .enum(["all", "pending", "accepted", "rejected"])
          .optional()
          .default("all"),
      }),
    )
    .query(async ({ ctx, input: { page, size, status } }) => {
      const where = and(
        ...(status !== "all" ? [eq(accessRequests.status, status)] : []),
      );
      const offset = (page - 1) * size;

      const list = await ctx.db.query.accessRequests.findMany({
        with: { user: true },
        where,
        limit: size,
        offset,
      });

      const totalRows = await ctx.db
        .select({ count: count() })
        .from(accessRequests)
        .where(where);

      const totalRowsCount = totalRows[0]?.count ?? 0;

      let nextPage: number | null = null;
      if (offset + size < totalRowsCount) {
        nextPage = page + 1;
      }

      return {
        list,
        previousPage: page > 1 ? page - 1 : null,
        nextPage,
        page,
        limit: size,
        total: totalRowsCount,
      };
    }),
  getAccessRequest: adminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const request = await ctx.db.query.accessRequests.findFirst({
        with: {
          user: true,
          reviewer: true,
        },
        where: eq(accessRequests.userId, input.userId),
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No access request found for the user with id ${input.userId}`,
        });
      }

      const questions = await ctx.db.select().from(accessRequestQuestions);
      const questionsAnswers = await Promise.all(
        questions.map(async (question) => {
          const answers = await ctx.db
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
                eq(accessRequestUserResponses.userId, input.userId),
                eq(accessRequestUserResponses.questionId, question.id),
              ),
            );

          return {
            ...question,
            answers: answers.map((item) => ({
              ...item.access_request_user_response,
              option: item.access_request_question_option,
            })),
          };
        }),
      );
      return { ...request, questionsAnswers };
    }),
  reviewAccessRequest: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        status: z.enum(["accepted", "rejected"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.userId));
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No user found with id ${input.userId}`,
        });
      }

      const [request] = await ctx.db
        .select()
        .from(accessRequests)
        .where(eq(accessRequests.userId, input.userId));
      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No access request found for user with id ${input.userId}`,
        });
      }

      await ctx.db
        .update(accessRequests)
        .set({
          status: input.status,
          reviewedBy: ctx.session.user.id,
          reviewedAt: new Date(),
        })
        .where(eq(accessRequests.userId, input.userId));

      if (input.status === "accepted") {
        const subject = `Your Access Request Has Been Approved! Welcome to ${APP_NAME} 🎉`;
        await resend.emails.send({
          from: NO_REPLY_EMAIL,
          to: user.email,
          subject,
          react: AccessRequestAccepted({
            title: subject,
            name:
              user.name ??
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              user.email.split("@")[0]!,
            appName: APP_NAME,
            appUrl: APP_URL,
            supportEmail: SUPPORT_EMAIL,
          }),
        });
      } else {
        const subject = `Update on Your Access Request for ${APP_NAME} - Request Not Approved`;
        await resend.emails.send({
          from: NO_REPLY_EMAIL,
          to: user.email,
          subject,
          react: AccessRequestRejected({
            title: subject,
            name:
              user.name ??
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              user.email.split("@")[0]!,
            appName: APP_NAME,
            appUrl: APP_URL,
            supportEmail: SUPPORT_EMAIL,
          }),
        });
      }
    }),
});
