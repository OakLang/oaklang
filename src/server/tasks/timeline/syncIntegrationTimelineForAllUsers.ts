import { Integration } from '~/server/schema';
import { MAX_INTEGRATION_ERRORS } from '~/utils/constants';
import { db } from '~/server/db';
import { lte } from 'drizzle-orm';
import { syncIntegrationTimeline } from './syncIntegrationTimeline';
import { wakaq } from '~/server/wakaq';

export const syncIntegrationTimelineForAllUsers = wakaq.task(
  async () => {
    await Promise.all(
      (await db.query.Integration.findMany({ where: lte(Integration.errorCount, MAX_INTEGRATION_ERRORS) })).map(async (connection) => {
        await syncIntegrationTimeline.enqueue(connection.id);
      }),
    );
  },
  { name: 'syncIntegrationTimelineForAllUsers' },
);
