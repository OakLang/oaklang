import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { createTRPCRouter, privateProcedure } from 'src/server/api/trpc';

import { User } from '~/server/schema';
import { db } from '~/server/db';
import { userToPublicUser } from '~/utils/backend';
import { z } from 'zod';

const searchInput = z.object({
  cursor: z.number().int().min(0).max(999).default(0),
  query: z.string().min(1).max(200),
});

export const searchRouter = createTRPCRouter({
  searchActivities: privateProcedure.input(searchInput).query(() => {
    return {
      items: [],
      nextCursor: undefined,
    };
  }),
  searchUsers: privateProcedure.input(searchInput).query(async (opts) => {
    const { cursor, query } = opts.input;
    const limit = 10;

    const users = await db.query.User.findMany({
      limit,
      offset: limit * cursor,
      orderBy: desc(User.createdAt),
      where: and(eq(User.isActive, true), or(ilike(User.username, `%${query}%`), ilike(User.githubFullName, `%${query}%`))),
    });

    return {
      items: await Promise.all(users.map(async (user) => userToPublicUser(user))),
      nextCursor: users.length == limit ? cursor + 1 : undefined,
    };
  }),
});
