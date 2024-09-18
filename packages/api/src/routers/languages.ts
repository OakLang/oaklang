import { languages } from "@acme/db/schema";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const languagesRouter = createTRPCRouter({
  getLanguages: publicProcedure.query(async ({ ctx: { db } }) => {
    const languagesList = await db.select().from(languages);
    return languagesList;
  }),
});
