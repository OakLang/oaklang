import { acquireLock, releaseLock } from 'src/server/lock';

import { Duration } from 'ts-duration';
import { integrationParams } from '~/utils/backend';
import { wakaq } from '~/server/wakaq';

export const syncBadgesStackExchange = wakaq.task(
  async (integrationId: unknown, jobId: unknown) => {
    const { connection, job } = await integrationParams(integrationId, jobId);
    if (!connection || !job) {
      wakaq.logger?.error(`Missing connection or jobid: [${integrationId as string}, ${jobId as string}]`);
      return;
    }

    // exclusive lock
    const lockKey = `syncBadges-${connection.id}`;
    const lockId = await acquireLock(lockKey, Duration.minute(10));
    if (!lockId) {
      return;
    }

    try {
      // TODO: create Badge for:
      // * user's total reputation, if over 100
      // * user's total reputation associated with a program language tag, if over 1k
    } catch (e) {
      await releaseLock(lockKey, lockId);
      throw e;
    }
    await releaseLock(lockKey, lockId);
  },
  { name: 'syncBadgesStackExchange' },
);
