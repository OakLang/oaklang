import { eq } from "@acme/db";
import {
  practiceLanguages,
  trainingSessions,
  users,
  userSettings,
  userWords,
} from "@acme/db/schema";

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
});
