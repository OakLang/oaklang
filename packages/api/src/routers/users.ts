import { createTRPCRouter, publicProcedure } from "../trpc";

export const usersRouter = createTRPCRouter({
  me: publicProcedure.query((opts) => {
    return opts.ctx.session?.user;
  }),
});
