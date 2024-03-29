import { acquireLock, releaseLock } from 'src/server/lock';
import { canSyncTimelineForConnection, getScrapeForConnection } from '~/integrations/utils/backend';
import { parseISO } from 'date-fns';
import { Duration } from 'ts-duration';
import { GlobalTimelineItem, Integration } from '~/server/schema';
import { TimelineEventType, TimelineTemplateType } from '~/utils/types';
import type { ProductHuntPost, TimelineTemplate } from '~/utils/types';
import { db } from '~/server/db';
import { eq } from 'drizzle-orm';
import { integrationParams } from '~/utils/backend';
import { wakaq } from '~/server/wakaq';
import { fanOutTimelineItemToFollowers } from './fanOutTimelineItemToFollowers';
import { formatNumber } from '~/utils';
import { truncate } from '~/utils/helpers';

const VOTE_COUNT = 50;

export const syncIntegrationTimelineProductHunt = wakaq.task(
  async (integrationId: unknown, jobId: unknown) => {
    const { connection, job } = await integrationParams(integrationId, jobId);
    if (!connection || !canSyncTimelineForConnection(connection)) {
      return;
    }

    // exclusive lock
    const lockKey = `syncIntegrationTimeline-${connection.id}`;
    const lockId = await acquireLock(lockKey, Duration.minute(10));
    if (!lockId) {
      wakaq.logger?.info(`Unable to acquire exclusive lock for sync integration timeline ${connection.id}`);
      return;
    }

    try {
      wakaq.logger?.info(`syncing timeline ${connection.provider}: ${connection.id} ${job}`);

      const scrape = await getScrapeForConnection(connection, 'posts');
      if (!scrape) {
        wakaq.logger?.info('Missing ProductHunt posts');
        await releaseLock(lockKey, lockId);
        return;
      }

      wakaq.logger?.info(`Using scrape ${scrape.scrapedAt.toISOString()}: ${connection.id} ${job}`);

      const posts = (scrape.jsonValue as { posts: ProductHuntPost[] }).posts;
      wakaq.logger?.info(`syncing ${posts.length} posts for ${connection.id}`);

      const values = posts
        .map((post) => {
          if (post.votesCount < VOTE_COUNT) {
            return;
          }

          return {
            eventType: TimelineEventType.interaction,
            integrationId: connection.id,
            postedAt: parseISO(post.createdAt),
            provider: connection.provider,
            score: post.votesCount,
            subtitle: (post.description
              ? [{ text: truncate(post.description), type: TimelineTemplateType.text }]
              : []) satisfies TimelineTemplate[],
            title: [
              { text: 'Launched ', type: TimelineTemplateType.text },
              { children: [{ text: post.name, type: TimelineTemplateType.text }], href: post.url, type: TimelineTemplateType.link },
              { text: ` with ${formatNumber(post.votesCount)} upvotes 🚀`, type: TimelineTemplateType.text },
            ] satisfies TimelineTemplate[],
            uniqueId: post.slug,
            userId: connection.userId,
          } satisfies typeof GlobalTimelineItem.$inferInsert;
        })
        .filter((item) => !!item) as (typeof GlobalTimelineItem.$inferInsert)[];

      if (values.length > 0) {
        const items = await db.insert(GlobalTimelineItem).values(values).onConflictDoNothing().returning({ id: GlobalTimelineItem.id });
        if (items.length > 0) {
          await Promise.all(items.map(async (item) => await fanOutTimelineItemToFollowers.enqueue(item.id)));
        }
      }

      await releaseLock(lockKey, lockId);
      await db.update(Integration).set({ lastSyncTimelineAt: scrape.scrapedAt }).where(eq(Integration.id, connection.id));
      wakaq.logger?.info(`finished sync timeline ${connection.provider}: ${connection.id} ${job}`);
    } catch (e) {
      wakaq.logger?.error(e);
      await releaseLock(lockKey, lockId);
    }
  },
  { name: 'syncIntegrationTimelineProductHunt' },
);
