import { Integration } from '~/server/schema';
import { MAX_INTEGRATION_ERRORS } from '~/utils/constants';
import { db } from '~/server/db';
import { lte } from 'drizzle-orm';
import { syncIntegrationMilestones } from './syncIntegrationMilestones';
import { wakaq } from '~/server/wakaq';

export const syncIntegrationMilestonesForAllUsers = wakaq.task(
  async () => {
    wakaq.logger?.info('running');
    await Promise.all(
      (await db.query.Integration.findMany({ where: lte(Integration.errorCount, MAX_INTEGRATION_ERRORS) })).map(async (connection) => {
        await syncIntegrationMilestones.enqueue(connection.id);
      }),
    );
  },
  { name: 'syncIntegrationMilestonesForAllUsers' },
);
