import { aiRouter } from "./routers/ai";
import { languagesRouter } from "./routers/language";
import { trainingSessionsRouter } from "./routers/trainingSession";
import { usersRouter } from "./routers/users";
import { createTRPCRouter, publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
  ai: aiRouter,
  healthCheck: publicProcedure.query(() => {
    return {
      message: "OK",
    };
  }),
  languages: languagesRouter,
  trainingSessions: trainingSessionsRouter,
  users: usersRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
