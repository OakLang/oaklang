import { acquireLock, releaseLock } from 'src/server/lock';
import {
  canScrapeConnection,
  incrementIntegrationErrorCount,
  resetIntegrationErrorCount,
  updateScrapeForConnection,
} from '~/integrations/utils/backend';
import { get, lvalues, rpush, set } from '~/integrations/store';
import { getIntegrationId, wonderfulFetch } from '~/integrations/utils';

import { Duration } from 'ts-duration';
import type { Integration } from 'src/server/schema';
import { generateProfileBio } from 'src/server/tasks/generateProfileBio';
import { integrationParams } from '~/utils/backend';
import { integrations } from '~/integrations/list';
import { wakaq } from '~/server/wakaq';

enum Stage {
  followers = 'followers',
  subscribers = 'subscribers',
}

export const scrapeIntegrationTwitch = wakaq.task(
  async (integrationId: unknown, jobId: unknown) => {
    const { connection, job } = await integrationParams(integrationId, jobId);
    if (!connection || !canScrapeConnection(connection)) {
      return;
    }

    // exclusive lock
    const lockKey = `scrapeIntegration-${connection.id}`;
    const lockId = await acquireLock(lockKey, Duration.minute(10));
    if (!lockId) {
      wakaq.logger?.info(`Unable to acquire exclusive lock for integration ${connection.id}`);
      return;
    }

    const integration = integrations.find((i) => {
      return getIntegrationId(i) === connection.provider;
    });
    if (!integration) {
      await releaseLock(lockKey, lockId);
      return;
    }

    const stage = Stage[((await get(job, 'stage')) ?? Stage.subscribers) as keyof typeof Stage];

    switch (stage) {
      case Stage.subscribers: {
        wakaq.logger?.info(`starting at stage ${stage}`);

        const cursor = (await get(job, `${stage}_cursor`)) ?? '';
        const url = `https://api.twitch.tv/helix/subscriptions?broadcaster_id=${connection.providerAccountId}&first=100&cursor=${cursor}`;
        const resp = await wonderfulFetch(url, {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
            'Client-Id': integration.clientId,
          },
        });
        if (resp.status !== 200) {
          wakaq.logger?.error(`Unable to get Twitch ${stage}: ${resp.status}`);
          wakaq.logger?.error(await resp.text());
          await releaseLock(lockKey, lockId);
          await incrementIntegrationErrorCount(connection);
          return;
        }
        await resetIntegrationErrorCount(connection);

        // https://dev.twitch.tv/docs/api/reference/#get-broadcaster-subscriptions
        const subscribers = (await resp.json()) as {
          data: {
            broadcaster_id: string;
            broadcaster_login: string;
            broadcaster_name: string;
            gifter_id: string;
            gifter_login: string;
            gifter_name: string;
            is_gift: boolean;
            plan_name: string;
            tier: string;
            user_id: string;
            user_login: string;
            user_name: string;
          }[];
          pagination?: { cursor?: string };
          points: number;
          total: number;
        };
        await Promise.all(
          subscribers.data.map(async (subscriber) => {
            return await rpush(job, stage, JSON.stringify(subscriber));
          }),
        );

        const nextCursor = subscribers.pagination?.cursor;
        if (nextCursor) {
          wakaq.logger?.info(`Stage ${stage} got next page cursor: ${nextCursor}`);
          await set(job, `${stage}_cursor`, nextCursor);
          await set(job, 'stage', stage); // refresh expire time
        } else {
          await updateScrapeForConnection(connection, stage, {
            subscribers: (await lvalues(job, stage)).map((item) => JSON.parse(item) as unknown),
          });
          await set(job, 'stage', getNextStage(stage, connection, job));
        }
        await releaseLock(lockKey, lockId);
        await scrapeIntegrationTwitch.enqueue(integrationId, job);
        break;
      }
      case Stage.followers: {
        wakaq.logger?.info(`starting at stage ${stage}: ${connection.id} ${job}`);

        const cursor = (await get(job, `${stage}_cursor`)) ?? '';
        const url = `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${connection.providerAccountId}&first=100&cursor=${cursor}`;
        const resp = await wonderfulFetch(url, {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
            'Client-Id': integration.clientId,
          },
        });
        if (resp.status !== 200) {
          wakaq.logger?.error(`Unable to get Twitch ${stage}: ${resp.status}`);
          wakaq.logger?.error(await resp.text());
          await releaseLock(lockKey, lockId);
          return;
        }

        // https://dev.twitch.tv/docs/api/reference/#get-channel-followers
        const followers = (await resp.json()) as {
          data: {
            followed_at: string;
            user_id: string;
            user_login: string;
            user_name: string;
          }[];
          pagination?: { cursor?: string };
          points: number;
          total: number;
        };
        await Promise.all(
          followers.data.map(async (follower) => {
            return await rpush(job, stage, JSON.stringify(follower));
          }),
        );

        const nextCursor = followers.pagination?.cursor;
        if (nextCursor) {
          wakaq.logger?.info(`Stage ${stage} got next page cursor: ${nextCursor}`);
          await set(job, `${stage}_cursor`, nextCursor);
          await set(job, 'stage', stage); // refresh expire time
          await releaseLock(lockKey, lockId);
          await scrapeIntegrationTwitch.enqueue(integrationId, job);
        } else {
          if (
            await updateScrapeForConnection(
              connection,
              stage,
              {
                followers: (await lvalues(job, stage)).map((item) => JSON.parse(item) as unknown),
              },
              true,
            )
          ) {
            await generateProfileBio.enqueue(connection.userId);
          }
          wakaq.logger?.info(`finished ${connection.provider}: ${connection.id} ${job}`);
        }
        break;
      }
    }
  },
  { name: 'scrapeIntegrationTwitch' },
);

const getNextStage = (currentStage: Stage, connection: typeof Integration.$inferSelect, job: string): Stage => {
  const nextStage = _getNextStage(currentStage);
  wakaq.logger?.info(`stage transition ${currentStage} -> ${nextStage}: ${connection.id} ${job}`);
  return nextStage;
};

const _getNextStage = (currentStage: Stage): Stage => {
  switch (currentStage) {
    case Stage.subscribers:
      return Stage.followers;
    case Stage.followers:
      throw new Error(`getNextStage should never be called with ${currentStage}`);
  }
};
