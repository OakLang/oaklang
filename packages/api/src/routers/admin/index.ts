import { createTRPCRouter } from "../../trpc";
import { usersRouter } from "./users";

export const adminRouter = createTRPCRouter({
  users: usersRouter,
});
