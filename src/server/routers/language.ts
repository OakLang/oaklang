import { languagesTable } from '~/lib/schema';
import { publicProcedure, router } from 'src/server/trpc';
import { asc, eq } from 'drizzle-orm';

export const languageRouter = router({
  getLanguages: publicProcedure.query(async (opts) => {
    const languages = await opts.ctx.db
      .select()
      .from(languagesTable)
      .where(eq(languagesTable.isActive, true))
      .orderBy(asc(languagesTable.name));
    return languages;
  }),
});
