import { createTRPCRouter } from "../../trpc";
import { accessRequestsRouter } from "./accessRequests";
import { usersRouter } from "./users";

export const adminRouter = createTRPCRouter({
  users: usersRouter,
  accessRequests: accessRequestsRouter,
});
