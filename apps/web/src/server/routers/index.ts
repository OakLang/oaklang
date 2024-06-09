import { publicProcedure, router } from 'src/server/trpc';
import { usersRouter } from './users';
import { trainingSessionsRouter } from './trainingSession';
import { aiRouter } from './ai';
import { languagesRouter } from './language';
import { z } from 'zod';
import { env } from '~/env';

export const appRouter = router({
  ai: aiRouter,
  checkPassword: publicProcedure.input(z.string()).mutation(({ input: password }) => {
    return password === env.PASSWORD;
  }),
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
