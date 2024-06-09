import { publicProcedure, router } from 'src/server/trpc';

export const usersRouter = router({
  me: publicProcedure.query((opts) => {
    return opts.ctx.session?.user;
  }),
});
