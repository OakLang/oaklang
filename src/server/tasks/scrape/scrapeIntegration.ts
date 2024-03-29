import { siGithub, siGitlab, siStackexchange, siTwitch, siTwitter, siWakatime, siProducthunt, siYoutube } from 'simple-icons';

import { Integration } from 'src/server/schema';
import { createCSRFToken } from '~/utils/csrf';
import { db } from '~/server/db';
import { eq } from 'drizzle-orm';
import { getIntegrationIdFromName } from '~/integrations/utils';
import { scrapeIntegrationGitHub } from './scrapeIntegrationGitHub';
import { scrapeIntegrationGitLab } from './scrapeIntegrationGitLab';
import { scrapeIntegrationStackExchange } from './scrapeIntegrationStackExchange';
import { scrapeIntegrationTwitch } from './scrapeIntegrationTwitch';
import { scrapeIntegrationTwitter } from './scrapeIntegrationTwitter';
import { scrapeIntegrationWakaTime } from './scrapeIntegrationWakaTime';
import { wakaq } from '~/server/wakaq';
import { z } from 'zod';
import { scrapeIntegrationProductHunt } from './scrapeIntegrationProductHunt';
import { scrapeIntegrationYouTube } from './scrapeIntegrationYouTube';

export const scrapeIntegration = wakaq.task(
  async (integrationId: unknown) => {
    wakaq.logger?.info(`Sync integration ${integrationId as string}`);

    const result = z.string().safeParse(integrationId);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    const connection = await db.query.Integration.findFirst({ where: eq(Integration.id, result.data) });
    if (!connection) {
      return;
    }

    const jobId = createCSRFToken(30);

    // TODO: update Integration.profileInfo with new follower counts after syncing in background, because in the future
    // we'll periodically sync integrations and maybe follower counts have changed

    switch (connection.provider) {
      case getIntegrationIdFromName(siStackexchange.title):
        await scrapeIntegrationStackExchange.enqueue(integrationId, jobId);
        break;
      case getIntegrationIdFromName(siGithub.title):
        await scrapeIntegrationGitHub.enqueue(integrationId, jobId);
        break;
      case getIntegrationIdFromName(siGitlab.title):
        await scrapeIntegrationGitLab.enqueue(integrationId, jobId);
        break;
      case getIntegrationIdFromName(siWakatime.title):
        await scrapeIntegrationWakaTime.enqueue(integrationId, jobId);
        break;
      case getIntegrationIdFromName(siTwitter.title):
        await scrapeIntegrationTwitter.enqueue(integrationId, jobId);
        break;
      case getIntegrationIdFromName(siYoutube.title):
        await scrapeIntegrationYouTube.enqueue(integrationId, jobId);
        break;
      case getIntegrationIdFromName(siTwitch.title):
        await scrapeIntegrationTwitch.enqueue(integrationId, jobId);
        break;
      case getIntegrationIdFromName(siProducthunt.title):
        await scrapeIntegrationProductHunt.enqueue(integrationId, jobId);
        break;
      default:
        break;
    }
  },
  { name: 'scrapeIntegration' },
);
