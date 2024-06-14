import { aiRouter } from "./routers/ai";
import { languagesRouter } from "./routers/languages";
import { sentencesRouter } from "./routers/sentences";
import { trainingSessionsRouter } from "./routers/trainingSessions";
import { usersRouter } from "./routers/users";
import { wordsRouter } from "./routers/words";
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
  words: wordsRouter,
  sentences: sentencesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
