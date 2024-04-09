import { publicProcedure, router } from 'src/server/trpc';
import { usersRouter } from './users';

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return {
      message: 'OK',
    };
  }),
  user: usersRouter,
});

export type AppRouter = typeof appRouter;
