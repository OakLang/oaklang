import { createTRPCRouter } from "../../trpc";
import { accessRequestsRouter } from "./accessRequests";
import { aiUsageRouter } from "./ai-usage";
import { usersRouter } from "./users";

export const adminRouter = createTRPCRouter({
  users: usersRouter,
  accessRequests: accessRequestsRouter,
  aiUsage: aiUsageRouter,
});
