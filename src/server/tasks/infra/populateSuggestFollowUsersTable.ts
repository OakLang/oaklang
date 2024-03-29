import { Integration, SuggestFollowUser, User } from 'src/server/schema';
import { acquireLock, releaseLock } from 'src/server/lock';
import { desc, eq, sql } from 'drizzle-orm';

import { Duration } from 'ts-duration';
import { db } from 'src/server/db';
import { wakaq } from '~/server/wakaq';

export const populateSuggestFollowUsersTable = wakaq.task(
  async () => {
    const lockKey = 'populateSuggestFollowUsersTable';
    const lockId = await acquireLock(lockKey, Duration.minute(10));
    if (!lockId) {
      return;
    }

    const limit = 100;

    // TODO: populate languages for suggested users

    try {
      await Promise.all(
        (
          await db
            .select({ id: User.id, score: sql<number>`sum(${Integration.providerAccountScore})`.as('score') })
            .from(User)
            .innerJoin(Integration, eq(Integration.userId, User.id))
            .groupBy(User.id)
            .limit(limit)
            .orderBy(desc(sql<number>`sum(${Integration.providerAccountScore})`.as('score')))
        ).map(async (user) => {
          await db
            .insert(SuggestFollowUser)
            .values({
              integrationMaxScore: user.score,
              userId: user.id,
            })
            .onConflictDoUpdate({ set: { integrationMaxScore: user.score }, target: SuggestFollowUser.userId });
        }),
      );
    } catch (e) {
      await releaseLock(lockKey, lockId);
      throw e;
    }
    await releaseLock(lockKey, lockId);
  },
  { name: 'populateSuggestFollowUsersTable' },
);
