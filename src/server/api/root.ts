import { adminRouter } from './routers/admin';
import { authRouter } from './routers/auth';
import { createTRPCRouter } from '~/server/api/trpc';
import { integrationsRouter } from './routers/integrations';
import { timelineRouter } from './routers/timeline';
import { usersRouter } from './routers/users';
import { searchRouter } from './routers/search';
import { listRouter } from './routers/list';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  admin: adminRouter,
  auth: authRouter,
  integrations: integrationsRouter,
  list: listRouter,
  search: searchRouter,
  timeline: timelineRouter,
  users: usersRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
