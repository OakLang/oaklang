import { siGithub, siGitlab, siStackexchange, siTwitch, siTwitter, siWakatime, siYoutube } from 'simple-icons';

import { getIntegrationIdFromName } from '~/integrations/utils';
import { integrationParams } from '~/utils/backend';
import { subHours } from 'date-fns';
import { syncBadgesGitHub } from './syncBadgesGitHub';
import { syncBadgesStackExchange } from './syncBadgesStackExchange';
import { syncBadgesWakaTime } from './syncBadgesWakaTime';
import { wakaq } from '~/server/wakaq';

export const syncBadges = wakaq.task(
  async (integrationId: unknown) => {
    const { connection, job } = await integrationParams(integrationId);
    if (!connection || !job) {
      return;
    }
    if (connection.lastScrapedAt && connection.lastScrapedAt > subHours(new Date(), 12)) {
      return;
    }

    switch (connection.provider) {
      case getIntegrationIdFromName(siStackexchange.title):
        await syncBadgesStackExchange.enqueue(integrationId, job);
        break;
      case getIntegrationIdFromName(siGithub.title):
        await syncBadgesGitHub.enqueue(integrationId, job);
        break;
      case getIntegrationIdFromName(siGitlab.title):
        // await syncBadgesGitLab.enqueue(integrationId);
        break;
      case getIntegrationIdFromName(siWakatime.title):
        await syncBadgesWakaTime.enqueue(integrationId, job);
        break;
      case getIntegrationIdFromName(siTwitter.title):
        // await syncBadgesTwitter.enqueue(integrationId);
        break;
      case getIntegrationIdFromName(siYoutube.title):
        // await syncBadgesYouTube.enqueue(integrationId);
        break;
      case getIntegrationIdFromName(siTwitch.title):
        // await syncBadgesTwitch.enqueue(integrationId);
        break;
    }
  },
  { name: 'syncBadges' },
);
