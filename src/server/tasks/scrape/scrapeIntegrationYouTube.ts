import { acquireLock, releaseLock } from 'src/server/lock';
import {
  canScrapeConnection,
  incrementIntegrationErrorCount,
  resetIntegrationErrorCount,
  updateScrapeForConnection,
} from '~/integrations/utils/backend';
import { Duration } from 'ts-duration';
import { integrationParams } from '~/utils/backend';
import { wakaq } from '~/server/wakaq';
import { rJT, wonderfulFetch } from '~/integrations/utils';
import type { YouTubeChannel, YoutubeVideo } from '~/utils/types';
import { bump, get, lpop, lvalues, rpush, set } from '~/integrations/store';
import type { Integration } from '~/server/schema';
import { generateProfileBio } from 'src/server/tasks/generateProfileBio';

enum Stage {
  save = 'save',
  videos = 'videos',
}

export const scrapeIntegrationYouTube = wakaq.task(
  async (integrationId: unknown, jobId: unknown) => {
    const { connection, job } = await integrationParams(integrationId, jobId);
    if (!connection || !canScrapeConnection(connection)) {
      return;
    }

    // exclusive lock
    const lockKey = `scrapeIntegration-${connection.id}`;
    const lockId = await acquireLock(lockKey, Duration.minute(10));
    if (!lockId) {
      wakaq.logger?.debug(`Unable to acquire exclusive lock for integration ${connection.id}`);
      return;
    }

    const providerInfo = connection.providerInfo as { channels: YouTubeChannel[] };

    if (providerInfo.channels.length === 0) {
      await releaseLock(lockKey, lockId);
      return;
    }

    let videos: YoutubeVideo[] = [];

    try {
      const stage = Stage[((await get(job, 'stage')) ?? Stage.videos) as keyof typeof Stage];
      switch (stage) {
        case Stage.videos: {
          const pageToken = await get(job, `${stage}.pageToken`);
          let channelId = await get(job, `${stage}.channelId`);
          wakaq.logger?.info(`pageToken: ${pageToken}, channelId: ${channelId}`);
          if (!channelId) {
            const channels = (connection.providerInfo as { channels: YouTubeChannel[] }).channels;
            if (channels.length === 0) {
              wakaq.logger?.error('Empty channels');
              await releaseLock(lockKey, lockId);
              return;
            }
            wakaq.logger?.info(`total ${channels.length} channels found`);
            await rpush(job, `${stage}.channels`, ...channels.map((channel) => JSON.stringify(channel)));
            const channel = JSON.parse((await lpop(job, `${stage}.channels`)) ?? 'null') as YouTubeChannel | null;
            if (!channel) {
              wakaq.logger?.error(`Missing channel: '${channel}'`);
              await releaseLock(lockKey, lockId);
              return;
            } else {
              channelId = channel.id;
              await set(job, `${stage}.channelId`, channelId);
            }
          }

          if (!channelId) {
            wakaq.logger?.error(`Missing channelId: '${channelId}'`);
            await releaseLock(lockKey, lockId);
            return;
          }

          const params = new URLSearchParams({
            channelId,
            maxResults: '100',
            ...(pageToken ? { pageToken } : {}),
            type: 'video',
          });
          const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
          const resp = await wonderfulFetch(url, {
            headers: {
              Authorization: `Bearer ${connection.accessToken}`,
            },
          });

          if (resp.status !== 200) {
            wakaq.logger?.error(`Unable to get ${stage} (${resp.status}): ${await rJT(resp)}`);
            await incrementIntegrationErrorCount(connection);
            await releaseLock(lockKey, lockId);
            return;
          }

          await resetIntegrationErrorCount(connection);
          const { items, nextPageToken } = (await resp.json()) as {
            items: {
              id: {
                videoId: string;
              };
            }[];
            nextPageToken?: string;
          };

          videos = (
            await Promise.all(
              items.map(async (item) => {
                const params = new URLSearchParams({
                  id: item.id.videoId,
                  part: 'statistics,snippet',
                });

                const url = `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`;
                const videoRes = await wonderfulFetch(url, {
                  headers: {
                    Authorization: `Bearer ${connection.accessToken}`,
                  },
                });

                if (resp.status !== 200) {
                  return;
                }

                const data = (await videoRes.json()) as {
                  items: YoutubeVideo[];
                };
                return data.items[0];
              }),
            )
          ).filter((item) => !!item) as YoutubeVideo[];

          wakaq.logger?.info(`Got ${videos.length} ${channelId} ${stage}`);

          if (videos.length > 0) {
            await rpush(job, stage, ...videos.map((video) => JSON.stringify(video)));
          }

          if (nextPageToken) {
            await set(job, `${stage}.pageToken`, nextPageToken);
            await bump(job, 'stage');
            await bump(job, `${stage}.channelId`);
            await bump(job, `${stage}.channels`);
          } else {
            const channel = JSON.parse((await lpop(job, `${stage}.channels`)) ?? 'null') as YouTubeChannel | null;
            if (channel) {
              await bump(job, 'stage');
              await bump(job, `${stage}.pageToken`);
              await set(job, `${stage}.channelId`, channel.id);
            } else {
              await set(job, 'stage', getNextStage(stage, connection, job));
            }
          }

          await releaseLock(lockKey, lockId);
          await scrapeIntegrationYouTube.enqueue(integrationId, job);
          break;
        }
        case Stage.save: {
          if (await saveStage(Stage.videos, connection, job, true)) {
            await generateProfileBio.enqueue(connection.userId);
          }
          wakaq.logger?.info(`finished ${connection.provider}: ${connection.id} ${job}`);
          // await syncIntegrationTimelineYouTube.enqueue(connection.id, createCSRFToken(30));
          break;
        }
        default: {
          break;
        }
      }
    } catch (e) {
      wakaq.logger?.error(e);
      await releaseLock(lockKey, lockId);
      return;
    }
  },
  { name: 'scrapeIntegrationYouTube' },
);

const getNextStage = (currentStage: Stage, connection: typeof Integration.$inferSelect, job: string): Stage => {
  const nextStage = _getNextStage(currentStage);
  wakaq.logger?.info(`stage transition ${currentStage} -> ${nextStage}: ${connection.id} ${job}`);
  return nextStage;
};

const _getNextStage = (currentStage: Stage): Stage => {
  switch (currentStage) {
    case Stage.videos:
      return Stage.save;
    case Stage.save:
      throw new Error(`getNextStage should never be called with ${currentStage}`);
  }
};

const saveStage = async (stage: Stage, connection: typeof Integration.$inferSelect, job: string, updateScrapedAt?: boolean) => {
  const items = await lvalues(job, stage);
  const videos = items.map((item) => JSON.parse(item) as YoutubeVideo);
  return await updateScrapeForConnection(connection, stage, { videos }, updateScrapedAt);
};
