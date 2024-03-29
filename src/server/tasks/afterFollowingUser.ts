import { FollowerTimelineItem, GlobalTimelineItem, UserFollow } from 'src/server/schema';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { wakaq } from '~/server/wakaq';
import { z } from 'zod';

export const afterFollowingUser = wakaq.task(
  async (params: unknown) => {
    const result = z.object({ followerUserId: z.string(), followingUserId: z.string() }).safeParse(params);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    const { followerUserId, followingUserId } = result.data;

    // check if user is still following the other
    const follow = await db.query.UserFollow.findFirst({
      where: and(eq(UserFollow.followedById, followerUserId), eq(UserFollow.followingId, followingUserId)),
    });
    if (!follow) {
      return;
    }

    await Promise.all(
      (
        await db.query.GlobalTimelineItem.findMany({
          where: eq(GlobalTimelineItem.userId, followingUserId),
        })
      ).map(async (globalItem) => {
        await db
          .insert(FollowerTimelineItem)
          .values({
            createdAt: globalItem.createdAt,
            followerId: followerUserId,
            globalTimelineItemId: globalItem.id,
            postedAt: globalItem.postedAt,
            programLanguageName: globalItem.programLanguageName,
            provider: globalItem.provider,
            userId: followingUserId,
          })
          .onConflictDoNothing();
      }),
    );
  },
  { name: 'afterFollowingUser' },
);
