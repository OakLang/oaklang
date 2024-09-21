import { eq } from "@acme/db";
import { users } from "@acme/db/schema";

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
});
