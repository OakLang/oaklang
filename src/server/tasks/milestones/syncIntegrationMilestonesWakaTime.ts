import { acquireLock, releaseLock } from 'src/server/lock';
import { canSyncMilestonesForConnection, getScrapeForConnection } from '~/integrations/utils/backend';

import { Duration } from 'ts-duration';
import { Integration } from '~/server/schema';
import type { WakaTimeStats } from '~/utils/types';
import { db } from '~/server/db';
import { eq } from 'drizzle-orm';
import { integrationParams } from '~/utils/backend';
import { wakaq } from '~/server/wakaq';

export const syncIntegrationMilestonesWakaTime = wakaq.task(
  async (integrationId: unknown, jobId: unknown) => {
    const { connection, job } = await integrationParams(integrationId, jobId);
    if (!connection || !canSyncMilestonesForConnection(connection)) {
      return;
    }

    // exclusive lock
    const lockKey = `syncIntegrationMilestones-${connection.id}`;
    const lockId = await acquireLock(lockKey, Duration.minute(10));
    if (!lockId) {
      wakaq.logger?.info(`Unable to acquire exclusive lock for sync integration timeline ${connection.id}`);
      return;
    }

    try {
      wakaq.logger?.info(`syncing timeline ${connection.provider}: ${connection.id} ${job}`);

      const scrape = await getScrapeForConnection(connection, 'stats');
      if (!scrape) {
        wakaq.logger?.info('Missing WakaTime status');
        await releaseLock(lockKey, lockId);
        return;
      }

      // TODO: create GlobalTimelineItem for conditions:
      // * user has more than 500, 1000, and multiples of 1k total code time
      // * user has more than 100, 500, 1000, and multiples of 1k code time in a program language
      // * user has more than 1000, and multiples of 1k code time in a text editor

      wakaq.logger?.info(`Using scrape ${scrape.scrapedAt.toISOString()}: ${connection.id} ${job}`);

      const languages = (scrape.jsonValue as { stats: WakaTimeStats }).stats.languages;
      wakaq.logger?.info(`syncing ${languages.length} languages for ${connection.id}`);

      await db.update(Integration).set({ lastSyncMilestonesAt: scrape.scrapedAt }).where(eq(Integration.id, connection.id));
      wakaq.logger?.info(`finished sync timeline ${connection.provider}: ${connection.id} ${job}`);
    } catch (e) {
      wakaq.logger?.error(e);
    }
    await releaseLock(lockKey, lockId);
  },
  { name: 'syncIntegrationMilestonesWakaTime' },
);
