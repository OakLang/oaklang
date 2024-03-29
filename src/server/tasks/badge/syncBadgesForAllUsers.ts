import { Integration } from '~/server/schema';
import { MAX_INTEGRATION_ERRORS } from '~/utils/constants';
import { db } from '~/server/db';
import { lte } from 'drizzle-orm';
import { syncBadges } from './syncBadges';
import { wakaq } from '~/server/wakaq';

export const syncBadgesForAllUsers = wakaq.task(
  async () => {
    await Promise.all(
      (await db.query.Integration.findMany({ where: lte(Integration.errorCount, MAX_INTEGRATION_ERRORS) })).map(async (connection) => {
        await syncBadges.enqueue(connection.id);
      }),
    );
  },
  { name: 'syncBadgesForAllUsers' },
);
