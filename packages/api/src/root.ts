import { adminRouter } from "./routers/admin";
import { collectionsRouter } from "./routers/collections";
import { languagesRouter } from "./routers/languages";
import { modulesRouter } from "./routers/modules";
import { sentencesRouter } from "./routers/sentences";
import { trainingSessionsRouter } from "./routers/trainingSessions";
import { usersRouter } from "./routers/users";
import { userSettingsRouter } from "./routers/userSettings";
import { wordsRouter } from "./routers/words";
import { createTRPCRouter, publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
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
  userSettings: userSettingsRouter,
  admin: adminRouter,
  collections: collectionsRouter,
  modules: modulesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
