import type { WakaTimeStats, WakaTimeUser } from '~/utils/types';
import { acquireLock, releaseLock } from 'src/server/lock';
import {
  canScrapeConnection,
  getScrapeForConnection,
  incrementIntegrationErrorCount,
  resetIntegrationErrorCount,
  updateScrapeForConnection,
} from '~/integrations/utils/backend';
import { getIntegrationId, wonderfulFetch } from '~/integrations/utils';

import { Duration } from 'ts-duration';
import { Integration } from 'src/server/schema';
import { WAKATIME_CATEGORIES_FOR_SCORE } from '~/utils/constants';
import { badgeInfoForConnection } from '~/integrations/extensions/getters';
import { db } from '~/server/db';
import { eq } from 'drizzle-orm';
import { integrationParams } from '~/utils/backend';
import { integrations } from '~/integrations/list';
import { subHours } from 'date-fns';
import { wakaq } from '~/server/wakaq';

export const scrapeIntegrationWakaTime = wakaq.task(
  async (integrationId: unknown, jobId: unknown, retries: unknown) => {
    const { connection, job } = await integrationParams(integrationId, jobId);
    if (!connection || !canScrapeConnection(connection)) {
      return;
    }

    const integration = integrations.find((i) => {
      return getIntegrationId(i) === connection.provider;
    });
    if (!integration) {
      throw Error(`Integration not found for ${connection.provider}`);
    }

    if (!connection.accessToken) {
      wakaq.logger?.warn(`Missing access token for integration ${connection.id}`);
      return;
    }

    // exclusive lock
    const lockKey = `scrapeIntegration-${connection.id}`;
    const lockId = await acquireLock(lockKey, Duration.minute(10));
    if (!lockId) {
      wakaq.logger?.info(`Unable to acquire exclusive lock for integration ${connection.id}`);
      return;
    }

    const tries = retries ? parseInt(retries as string) : 0;
    const scrape = await getScrapeForConnection(connection, 'stats');

    let stats: WakaTimeStats;
    if (scrape && scrape.scrapedAt > subHours(new Date(), 12)) {
      stats = (scrape.jsonValue as { stats: WakaTimeStats }).stats;
    } else {
      try {
        const params = new URLSearchParams({ timeout: '15', token: connection.accessToken, writes_only: 'false' });
        const resp = await wonderfulFetch(`https://api.wakatime.com/api/v1/users/current/stats/all_time?${params.toString()}`);
        if (resp.status >= 300) {
          wakaq.logger?.error(`Unable to get WakaTime user code stats ${resp.status}: ${await resp.text()}`);

          const exists = await wonderfulFetch(`https://api.wakatime.com/api/v1/users/${connection.providerAccountId}`);
          if (exists.status === 404) {
            wakaq.logger?.error(`User has deleted their WakaTime account ${exists.status}: ${await exists.text()}`);
            await db.delete(Integration).where(eq(Integration.id, connection.id));
          } else {
            await incrementIntegrationErrorCount(connection);
          }

          await releaseLock(lockKey, lockId);
          return;
        }
        await resetIntegrationErrorCount(connection);

        if (resp.status == 202) {
          if (tries >= 100) {
            wakaq.logger?.error('WakaTime user code stats pending, tried 100 times now giving up');
            await releaseLock(lockKey, lockId);
            return;
          }
          wakaq.logger?.error(`WakaTime user code stats pending, will retry in ${tries + 1} minutes`);
          await releaseLock(lockKey, lockId);
          await scrapeIntegrationWakaTime.enqueueAfterDelay(Duration.minute(tries + 1), integrationId, job, tries + 1);
          return;
        }

        stats = ((await resp.json()) as { data: WakaTimeStats }).data;
      } catch (e) {
        if (tries >= 100) {
          wakaq.logger?.error('WakaTime user code stats pending, tried 100 times now giving up');
          await releaseLock(lockKey, lockId);
          return;
        }
        wakaq.logger?.debug(`failed to fetch WakaTime stats, will retry in ${tries + 1} minutes`);
        await releaseLock(lockKey, lockId);
        await scrapeIntegrationWakaTime.enqueueAfterDelay(Duration.minute(tries + 1), integrationId, job, tries + 1);
        return;
      }

      await updateScrapeForConnection(connection, 'stats', { stats }, true);
    }

    const info = connection.providerInfo as WakaTimeUser;
    info.total_seconds = Math.floor(
      stats.categories
        .filter((c) => WAKATIME_CATEGORIES_FOR_SCORE.includes(c.name))
        .map((c) => c.total_seconds)
        .reduce((p, c) => c + p, 0),
    );

    const score = badgeInfoForConnection(undefined, info, connection.provider).score;
    if (score < 0) {
      wakaq.logger?.warn(`score is ${score}`);
      return;
    }

    await db
      .update(Integration)
      .set({
        providerAccountScore: Math.floor(score),
        providerInfo: info,
      })
      .where(eq(Integration.id, connection.id));

    wakaq.logger?.debug('Finished syncing WakaTime code stats');
    await releaseLock(lockKey, lockId);
  },
  { name: 'scrapeIntegrationWakaTime' },
);
