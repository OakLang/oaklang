import { FollowerTimelineItem, GlobalTimelineItem, UserFollow } from 'src/server/schema';

import { db } from '~/server/db';
import { eq } from 'drizzle-orm';
import { wakaq } from '~/server/wakaq';
import { z } from 'zod';

export const fanOutTimelineItemToFollowers = wakaq.task(
  async (timelineItemId: unknown) => {
    const result = z.string().safeParse(timelineItemId);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    const item = await db.query.GlobalTimelineItem.findFirst({ where: eq(GlobalTimelineItem.id, result.data) });
    if (!item) {
      return;
    }

    await Promise.all(
      (
        await db.query.UserFollow.findMany({
          where: eq(UserFollow.followingId, item.userId),
        })
      ).map(async (f) => {
        await db.insert(FollowerTimelineItem).values({
          createdAt: item.createdAt,
          followerId: f.followedById,
          globalTimelineItemId: item.id,
          postedAt: item.postedAt,
          programLanguageName: item.programLanguageName,
          provider: item.provider,
          userId: f.followingId,
        });
      }),
    );
  },
  { name: 'fanOutTimelineItemToFollowers' },
);
