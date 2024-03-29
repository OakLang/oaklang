import { acquireLock, releaseLock } from 'src/server/lock';

import { Duration } from 'ts-duration';
import { MAX_INTEGRATION_ERRORS } from '~/utils/constants';
import { getScrapeForConnection } from '~/integrations/utils/backend';
import { integrationParams } from '~/utils/backend';
import { subHours } from 'date-fns';
import { wakaq } from '~/server/wakaq';

export const syncBadgesWakaTime = wakaq.task(
  async (integrationId: unknown, jobId: unknown) => {
    const { connection, job } = await integrationParams(integrationId, jobId);
    if (!connection || !job) {
      wakaq.logger?.error(`Missing connection or jobid: [${integrationId as string}, ${jobId as string}]`);
      return;
    }
    if (connection.errorCount > MAX_INTEGRATION_ERRORS) {
      return;
    }
    if (connection.lastScrapedAt && connection.lastScrapedAt > subHours(new Date(), 12)) {
      return;
    }

    // exclusive lock
    const lockKey = `syncIntegrationTimeline-${connection.id}`;
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

      // TODO: create Badge for:
      // * user's total code time, if over 1k hours
      // * user's code time in a language, if over 500 hours
      // * user's code time in a text editor, if over 1k hours
    } catch (e) {
      await releaseLock(lockKey, lockId);
      throw e;
    }
    await releaseLock(lockKey, lockId);
  },
  { name: 'syncBadgesWakaTime' },
);
