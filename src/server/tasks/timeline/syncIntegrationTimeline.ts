import { siGithub, siGitlab, siProducthunt, siStackexchange, siTwitch, siTwitter, siWakatime, siYoutube } from 'simple-icons';

import { canSyncTimelineForConnection } from '~/integrations/utils/backend';
import { getIntegrationIdFromName } from '~/integrations/utils';
import { integrationParams } from '~/utils/backend';
import { syncIntegrationTimelineGitHub } from './syncIntegrationTimelineGitHub';
import { syncIntegrationTimelineStackExchange } from './syncIntegrationTimelineStackExchange';
import { syncIntegrationTimelineWakaTime } from './syncIntegrationTimelineWakaTime';
import { wakaq } from '~/server/wakaq';
import { syncIntegrationTimelineProductHunt } from './syncIntegrationTimelineProductHunt';
import { syncIntegrationTimelineYouTube } from './syncIntegrationTimelineYouTube';

export const syncIntegrationTimeline = wakaq.task(
  async (integrationId: unknown) => {
    const { connection, job } = await integrationParams(integrationId);
    if (!connection || !canSyncTimelineForConnection(connection)) {
      return;
    }

    switch (connection.provider) {
      case getIntegrationIdFromName(siStackexchange.title):
        await syncIntegrationTimelineStackExchange.enqueue(integrationId, job);
        break;
      case getIntegrationIdFromName(siGithub.title):
        await syncIntegrationTimelineGitHub.enqueue(integrationId, job);
        break;
      case getIntegrationIdFromName(siGitlab.title):
        // await syncIntegrationTimelineGitLab.enqueue(integrationId);
        break;
      case getIntegrationIdFromName(siWakatime.title):
        await syncIntegrationTimelineWakaTime.enqueue(integrationId, job);
        break;
      case getIntegrationIdFromName(siTwitter.title):
        // await syncIntegrationTimelineTwitter.enqueue(integrationId);
        break;
      case getIntegrationIdFromName(siYoutube.title):
        await syncIntegrationTimelineYouTube.enqueue(integrationId, job);
        break;
      case getIntegrationIdFromName(siTwitch.title):
        // await syncIntegrationTimelineTwitch.enqueue(integrationId);
        break;
      case getIntegrationIdFromName(siProducthunt.title):
        await syncIntegrationTimelineProductHunt.enqueue(integrationId, job);
        break;
    }
  },
  { name: 'syncIntegrationTimeline' },
);
