import { publicProcedure, router } from 'src/server/trpc';
import { usersRouter } from './users';
import { trainingSessionsRouter } from './trainingSession';
import { aiRouter } from './ai';
import { languagesRouter } from './language';

export const appRouter = router({
  ai: aiRouter,
  healthCheck: publicProcedure.query(() => {
    return {
      message: 'OK',
    };
  }),
  languages: languagesRouter,
  trainingSessions: trainingSessionsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
