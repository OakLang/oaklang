import { publicProcedure, router } from 'src/server/trpc';
import { usersRouter } from './users';
import { trainingSessionsRouter } from './trainingSession';

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return {
      message: 'OK',
    };
  }),
  trainingSessions: trainingSessionsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
