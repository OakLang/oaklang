import { siGithub, siGitlab, siStackexchange, siTwitch, siTwitter, siWakatime, siYoutube } from 'simple-icons';

import { canSyncMilestonesForConnection } from '~/integrations/utils/backend';
import { getIntegrationIdFromName } from '~/integrations/utils';
import { integrationParams } from '~/utils/backend';
import { syncIntegrationMilestonesGitHub } from './syncIntegrationMilestonesGitHub';
import { syncIntegrationMilestonesStackExchange } from './syncIntegrationMilestonesStackExchange';
import { syncIntegrationMilestonesWakaTime } from './syncIntegrationMilestonesWakaTime';
import { wakaq } from '~/server/wakaq';

export const syncIntegrationMilestones = wakaq.task(
  async (integrationId: unknown) => {
    const { connection, job } = await integrationParams(integrationId);
    if (!connection || !canSyncMilestonesForConnection(connection)) {
      return;
    }

    switch (connection.provider) {
      case getIntegrationIdFromName(siStackexchange.title):
        await syncIntegrationMilestonesStackExchange.enqueue(integrationId, job);
        break;
      case getIntegrationIdFromName(siGithub.title):
        await syncIntegrationMilestonesGitHub.enqueue(integrationId, job);
        break;
      case getIntegrationIdFromName(siGitlab.title):
        // await syncIntegrationMilestonesGitLab.enqueue(integrationId);
        break;
      case getIntegrationIdFromName(siWakatime.title):
        await syncIntegrationMilestonesWakaTime.enqueue(integrationId, job);
        break;
      case getIntegrationIdFromName(siTwitter.title):
        // await syncIntegrationMilestonesTwitter.enqueue(integrationId);
        break;
      case getIntegrationIdFromName(siYoutube.title):
        // await syncIntegrationMilestonesYouTube.enqueue(integrationId);
        break;
      case getIntegrationIdFromName(siTwitch.title):
        // await syncIntegrationMilestonesTwitch.enqueue(integrationId);
        break;
    }
  },
  { name: 'syncIntegrationMilestones' },
);
