import type { YouTubeChannel, YoutubeVideo } from '~/utils/types';
import { TimelineEventType, TimelineTemplateType } from '~/utils/types';
import { GlobalTimelineItem } from 'src/server/schema';
import { acquireLock, releaseLock } from 'src/server/lock';
import { and, eq, sql } from 'drizzle-orm';
import { parseISO } from 'date-fns';

import { Duration } from 'ts-duration';
import { db } from 'src/server/db';
import { fanOutTimelineItemToFollowers } from '~/server/tasks/timeline/fanOutTimelineItemToFollowers';
import { integrationParams } from '~/utils/backend';
import { wakaq } from '~/server/wakaq';
import { scrapeIntegration } from 'src/server/tasks/scrape/scrapeIntegration';
import { truncate } from '~/utils/helpers';
import { canSyncTimelineForConnection, getScrapeForConnection } from '~/integrations/utils/backend';
import { formatNumber } from '~/utils';

export const syncIntegrationTimelineYouTube = wakaq.task(
  async (integrationId: unknown, jobId: unknown) => {
    const { connection, job } = await integrationParams(integrationId, jobId);
    if (!connection || !canSyncTimelineForConnection(connection)) {
      return;
    }

    // exclusive lock
    const lockKey = `syncIntegrationTimeline-${connection.id}`;
    const lockId = await acquireLock(lockKey, Duration.minute(10));
    if (!lockId) {
      wakaq.logger?.debug(`Unable to acquire exclusive lock for sync integration timeline ${connection.id}`);
      return;
    }

    try {
      const scrape = await getScrapeForConnection(connection, 'videos');
      if (!scrape) {
        await scrapeIntegration.enqueue(connection.id);
        await releaseLock(lockKey, lockId);
        return;
      }

      const channels = (connection.providerInfo as { channels: YouTubeChannel[] }).channels;

      const newItems = (
        await Promise.all(
          (scrape.jsonValue as { videos: YoutubeVideo[] }).videos.map(async (item) => {
            if (!_isSignificant(item)) {
              return;
            }
            const channel = channels.find((u) => u.id === item.snippet.channelId);
            if (!channel) {
              return;
            }
            const exists = await db.execute<{ exists: boolean }>(
              sql`select exists(${db
                .select({ n: sql`1` })
                .from(GlobalTimelineItem)
                .where(
                  and(
                    eq(GlobalTimelineItem.userId, connection.userId),
                    eq(GlobalTimelineItem.integrationId, connection.id),
                    eq(GlobalTimelineItem.uniqueId, String(item.id)),
                  ),
                )}) as exists`,
            );
            if (exists[0]?.exists) {
              return;
            }
            return item;
          }),
        )
      ).filter((item) => !!item) as YoutubeVideo[];

      if (newItems.length > 0) {
        const values = newItems.map((item) => {
          // const channel = channels.find((u) => u.id === item.snippet.channelId);
          const posted = parseISO(item.snippet.publishedAt);
          return {
            eventType: TimelineEventType.interaction,
            integrationId: connection.id,
            postedAt: posted,
            provider: connection.provider,
            score: parseInt(item.statistics.likeCount),
            subtitle: [{ text: truncate(item.snippet.description), type: TimelineTemplateType.text }],
            title: [
              { text: 'Published ', type: TimelineTemplateType.text },
              {
                children: [{ text: item.snippet.title, type: TimelineTemplateType.text }],
                href: `https://www.youtube.com/watch?v=${item.id}`,
                type: TimelineTemplateType.link,
              },
              { text: ` with ${formatNumber(parseInt(item.statistics.likeCount))} likes`, type: TimelineTemplateType.text },
            ],
            uniqueId: item.id,
            userId: connection.userId,
          } satisfies typeof GlobalTimelineItem.$inferInsert;
        });
        const items = await db.insert(GlobalTimelineItem).values(values).returning({ id: GlobalTimelineItem.id });
        await Promise.all(items.map(async (item) => await fanOutTimelineItemToFollowers.enqueue(item.id)));
      }

      await releaseLock(lockKey, lockId);
      await syncIntegrationTimelineYouTube.enqueue(integrationId, job);
    } catch (e) {
      await releaseLock(lockKey, lockId);
      throw e;
    }
    await releaseLock(lockKey, lockId);
  },
  { name: 'syncIntegrationTimelineYouTube' },
);

const _isSignificant = (item: YoutubeVideo): boolean => {
  return parseInt(item.statistics.likeCount) > 1_000 || parseInt(item.statistics.viewCount) > 100_000;
};
