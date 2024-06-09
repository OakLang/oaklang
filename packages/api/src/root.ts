import { z } from "zod";
import { aiRouter } from "./routers/ai";
import { createTRPCRouter, publicProcedure } from "./trpc";
import { languagesRouter } from "./routers/language";
import { trainingSessionsRouter } from "./routers/trainingSession";
import { usersRouter } from "./routers/users";
import { env } from "./env";

export const appRouter = createTRPCRouter({
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

// export type definition of API
export type AppRouter = typeof appRouter;
