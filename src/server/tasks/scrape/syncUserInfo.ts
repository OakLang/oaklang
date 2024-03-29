import { Integration, IntegrationHistoricalScore, IntegrationScrape } from 'src/server/schema';
import { and, eq, gt } from 'drizzle-orm';
import { getConnectionById, incrementIntegrationErrorCount, resetIntegrationErrorCount } from '~/integrations/utils/backend';
import { subDays, subHours } from 'date-fns';

import { MAX_INTEGRATION_ERRORS } from '~/utils/constants';
import { badgeInfoForConnection } from '~/integrations/extensions/getters';
import { db } from '~/server/db';
import { getIntegrationId } from '~/integrations/utils';
import { integrations } from '~/integrations/list';
import { scrapeIntegration } from './scrapeIntegration';
import { wakaq } from '~/server/wakaq';
import { z } from 'zod';

export const syncUserInfo = wakaq.task(
  async (integrationId: unknown) => {
    const result = z.string().safeParse(integrationId);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    const connection = await getConnectionById(result.data);
    if (!connection?.accessToken) {
      return;
    }
    if (connection.errorCount > MAX_INTEGRATION_ERRORS) {
      return;
    }
    if (connection.lastSyncUserInfoAt && connection.lastSyncUserInfoAt > subHours(new Date(), 20)) {
      wakaq.logger?.debug(`Skip sync ${connection.provider} user info for ${connection.id} because already recenly synced`);
      return;
    }

    wakaq.logger?.debug(`Updating ${connection.provider} user info for ${connection.id}`);

    const integration = integrations.find((i) => {
      return getIntegrationId(i) === connection.provider;
    });
    if (!integration) {
      throw Error(`Integration not found for ${connection.provider}`);
    }

    if (integration.needsScrapeForUserInfo) {
      const scrape = await db.query.IntegrationScrape.findFirst({
        columns: { scrapedAt: true },
        where: and(
          eq(IntegrationScrape.userId, connection.userId),
          eq(IntegrationScrape.integrationId, connection.id),
          gt(IntegrationScrape.scrapedAt, connection.lastSyncUserInfoAt ?? subDays(new Date(), 7)),
        ),
      });
      if (!scrape?.scrapedAt) {
        await scrapeIntegration.enqueue(connection.id);
        return;
      }
    }

    const userInfo = await integration.userInfoHandler(integration, connection.accessToken, { connection });
    const { error } = userInfo;
    if (error ?? !userInfo.info) {
      wakaq.logger?.warn(`Unable to get user info: ${userInfo.error}`);
      if (connection.errorCount >= MAX_INTEGRATION_ERRORS) {
        wakaq.logger?.warn(`More than ${MAX_INTEGRATION_ERRORS} errors, no longer updating this integration.`);
      }
      await incrementIntegrationErrorCount(connection);
      return;
    }
    await resetIntegrationErrorCount(connection);

    const score = badgeInfoForConnection(connection, userInfo.info, connection.provider).score;
    if (score < 0) {
      wakaq.logger?.warn(`score is ${score}`);
      await db
        .update(Integration)
        .set({
          lastSyncUserInfoAt: new Date(),
        })
        .where(eq(Integration.id, connection.id));
      return;
    }

    await db
      .insert(IntegrationHistoricalScore)
      .values({
        date: new Date(),
        provider: connection.provider,
        providerAccountId: connection.providerAccountId,
        score: Math.floor(score),
      })
      .onConflictDoNothing();

    await db
      .update(Integration)
      .set({
        lastSyncUserInfoAt: new Date(),
        providerAccountScore: Math.floor(score),
        providerAccountUsername: userInfo.username,
        providerInfo: userInfo.info,
      })
      .where(eq(Integration.id, connection.id));
  },
  { name: 'syncUserInfo' },
);
