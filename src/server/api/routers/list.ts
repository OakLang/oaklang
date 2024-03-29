import { z } from 'zod';
import { createTRPCRouter, privateProcedure, publicProcedure } from 'src/server/api/trpc';
import { db } from '~/server/db';
import { GlobalTimelineItem, List, ListFollower, ListMember, User } from '~/server/schema';
import { authenticatedUserFromRequest } from '~/utils/auth';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { createNewListSchema, updateListSchema } from '~/utils/validators';
import {
  doesUserFollowUser,
  getList,
  getListFollowerCount,
  getListMemberCount,
  timelineItemToPublic,
  userToPublicUser,
} from '~/utils/backend';

export const listRouter = createTRPCRouter({
  addMember: privateProcedure.input(z.object({ listId: z.string(), userId: z.string() })).mutation(async (opts) => {
    const currentUser = await authenticatedUserFromRequest(opts.ctx.req);
    if (!currentUser) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const list = await db.query.List.findFirst({
      where: and(eq(List.isActive, true), eq(List.id, opts.input.listId)),
    });

    if (!list) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'List not found!' });
    }

    if (list.userId !== currentUser.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You are not the owner of this list!' });
    }

    const user = await db.query.User.findFirst({
      where: and(eq(User.isActive, true), eq(User.id, opts.input.userId)),
    });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found!' });
    }

    await db
      .insert(ListMember)
      .values({
        listId: opts.input.listId,
        userId: opts.input.userId,
      })
      .onConflictDoNothing();
  }),
  createList: privateProcedure.input(createNewListSchema).mutation(async (opts) => {
    const currentUser = await authenticatedUserFromRequest(opts.ctx.req);

    if (!currentUser) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const [list] = await db
      .insert(List)
      .values({
        description: opts.input.description ?? null,
        isPrivate: opts.input.isPrivate,
        name: opts.input.name,
        userId: currentUser.id,
      })
      .returning({ id: List.id });

    return list;
  }),
  deleteList: privateProcedure.input(z.object({ listId: z.string() })).mutation(async (opts) => {
    const currentUser = await authenticatedUserFromRequest(opts.ctx.req);
    if (!currentUser) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const list = await db.query.List.findFirst({
      where: and(eq(List.isActive, true), eq(List.id, opts.input.listId)),
    });

    if (!list) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'List not found!' });
    }

    if (list.userId !== currentUser.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You are not the owner of this list!' });
    }

    await db.delete(List).where(eq(List.id, opts.input.listId));
  }),
  followList: privateProcedure.input(z.object({ listId: z.string() })).mutation(async (opts) => {
    const currentUser = await authenticatedUserFromRequest(opts.ctx.req);
    if (!currentUser) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const list = await getList(opts.input.listId, opts.ctx.req, undefined, 0, 0);

    if (!list) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'List not found!' });
    }

    await db.insert(ListFollower).values({
      listId: list.id,
      userId: currentUser.id,
    });
  }),
  getFollowers: publicProcedure.input(z.object({ cursor: z.number().min(0).default(0), listId: z.string() })).query(async (opts) => {
    const currentUser = await authenticatedUserFromRequest(opts.ctx.req);
    const list = await getList(opts.input.listId, opts.ctx.req);

    if (!list) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'List not found!' });
    }

    const limit = 10;
    const followers = await db
      .select()
      .from(ListFollower)
      .innerJoin(User, eq(User.id, ListFollower.userId))
      .where(eq(ListFollower.listId, opts.input.listId))
      .orderBy(desc(ListFollower.createdAt))
      .limit(limit)
      .offset(limit * opts.input.cursor);

    return {
      items: await Promise.all(
        followers.map(async ({ User }) => {
          const publicUser = await userToPublicUser(User, 0, 0);
          const doesFollowMe = !!currentUser && (await doesUserFollowUser(currentUser.id, User.id));
          const isFollowing = !!currentUser && (await doesUserFollowUser(User.id, currentUser.id));
          return {
            ...publicUser,
            doesFollowMe,
            isFollowing,
          };
        }),
      ),
      nextCursor: followers.length === limit ? opts.input.cursor + 1 : undefined,
    };
  }),
  getList: publicProcedure.input(z.object({ listId: z.string() })).query(async (opts) => {
    const list = await getList(opts.input.listId, opts.ctx.req);

    if (!list) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'List not found!' });
    }

    return list;
  }),
  getListsForUser: publicProcedure.input(z.object({ cursor: z.number().min(0).default(0), username: z.string() })).query(async (opts) => {
    const currentUser = await authenticatedUserFromRequest(opts.ctx.req);

    const user = await db.query.User.findFirst({
      where: and(eq(User.username, opts.input.username), eq(User.isActive, true)),
    });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found!' });
    }

    const limit = 10;

    const items = await db
      .selectDistinct({ list: List, user: User })
      .from(List)
      .leftJoin(ListFollower, eq(List.id, ListFollower.listId))
      .innerJoin(User, eq(User.id, List.userId))
      .where(
        and(
          eq(List.isActive, true),
          ...(currentUser ? [or(eq(List.isPrivate, false), eq(List.userId, currentUser.id))] : [eq(List.isPrivate, false)]),
          or(eq(List.userId, user.id), eq(ListFollower.userId, user.id)),
        ),
      )
      .orderBy(desc(List.createdAt))
      .limit(limit)
      .offset(limit * opts.input.cursor);

    return {
      items: await Promise.all(
        items.map(async (lm) => {
          return {
            ...lm.list,
            followersCount: await getListFollowerCount(lm.list.id),
            membersCount: await getListMemberCount(lm.list.id),
            user: await userToPublicUser(lm.user),
          };
        }),
      ),
      nextCursor: items.length === limit ? opts.input.cursor + 1 : undefined,
    };
  }),
  getMembers: publicProcedure.input(z.object({ cursor: z.number().min(0).default(0), listId: z.string() })).query(async (opts) => {
    const currentUser = await authenticatedUserFromRequest(opts.ctx.req);

    const list = await getList(opts.input.listId, opts.ctx.req);

    if (!list) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'List not found!' });
    }

    const limit = 10;
    const members = await db
      .select()
      .from(ListMember)
      .innerJoin(User, eq(User.id, ListMember.userId))
      .where(eq(ListMember.listId, opts.input.listId))
      .orderBy(desc(ListMember.createdAt))
      .limit(limit)
      .offset(limit * opts.input.cursor);

    return {
      items: await Promise.all(
        members.map(async ({ User }) => {
          const publicUser = await userToPublicUser(User, 0, 0);
          const doesFollowMe = !!currentUser && (await doesUserFollowUser(currentUser.id, User.id));
          const isFollowing = !!currentUser && (await doesUserFollowUser(User.id, currentUser.id));
          return {
            ...publicUser,
            doesFollowMe,
            isFollowing,
          };
        }),
      ),
      nextCursor: members.length === limit ? opts.input.cursor + 1 : undefined,
    };
  }),
  isFollowingList: privateProcedure.input(z.object({ listId: z.string() })).query(async (opts) => {
    const currentUser = await authenticatedUserFromRequest(opts.ctx.req);

    if (!currentUser) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const isFollowing = await db.query.ListFollower.findFirst({
      where: and(eq(ListFollower.listId, opts.input.listId), eq(ListFollower.userId, currentUser.id)),
    });

    return !!isFollowing;
  }),
  removeMember: privateProcedure.input(z.object({ listId: z.string(), userId: z.string() })).mutation(async (opts) => {
    const currentUser = await authenticatedUserFromRequest(opts.ctx.req);
    if (!currentUser) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const list = await db.query.List.findFirst({
      where: and(eq(List.isActive, true), eq(List.id, opts.input.listId)),
    });

    if (!list) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'List not found!' });
    }

    if (list.userId !== currentUser.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You are not the owner of this list!' });
    }

    await db.delete(ListMember).where(and(eq(ListMember.listId, opts.input.listId), eq(ListMember.userId, opts.input.userId)));
  }),
  timeline: publicProcedure.input(z.object({ cursor: z.number().min(0).default(0), listId: z.string() })).query(async (opts) => {
    const list = await getList(opts.input.listId, opts.ctx.req);

    if (!list) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'List not found!' });
    }

    const members = await db
      .select({ id: ListMember.userId })
      .from(ListMember)
      .where(eq(ListMember.listId, list.id))
      .then((result) => result.map((item) => item.id));

    if (members.length === 0) {
      return {
        items: [],
      };
    }

    const limit = 10;

    const items = await db
      .select()
      .from(GlobalTimelineItem)
      .innerJoin(User, eq(GlobalTimelineItem.userId, User.id))
      .where(inArray(GlobalTimelineItem.userId, members))
      .orderBy(desc(GlobalTimelineItem.createdAt), desc(GlobalTimelineItem.postedAt))
      .limit(limit)
      .offset(limit * opts.input.cursor);

    return {
      items: await Promise.all(items.map((item) => timelineItemToPublic(item.GlobalTimelineItem, item.User))),
      nextCursor: items.length === limit ? opts.input.cursor + 1 : undefined,
    };
  }),
  unfollowList: privateProcedure.input(z.object({ listId: z.string() })).mutation(async (opts) => {
    const currentUser = await authenticatedUserFromRequest(opts.ctx.req);
    if (!currentUser) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const list = await getList(opts.input.listId, opts.ctx.req);

    if (!list) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'List not found!' });
    }

    await db.delete(ListFollower).where(and(eq(ListFollower.listId, list.id), eq(ListFollower.userId, currentUser.id)));
  }),
  updateList: privateProcedure.input(updateListSchema).mutation(async (opts) => {
    const currentUser = await authenticatedUserFromRequest(opts.ctx.req);
    if (!currentUser) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const list = await db.query.List.findFirst({
      where: and(eq(List.isActive, true), eq(List.id, opts.input.id)),
    });

    if (!list) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'List not found!' });
    }

    if (list.userId !== currentUser.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You are not the owner of this list!' });
    }

    await db
      .update(List)
      .set({
        ...(opts.input.description !== undefined ? { description: opts.input.description } : {}),
        ...(opts.input.isPrivate !== undefined ? { isPrivate: opts.input.isPrivate } : {}),
        ...(opts.input.name !== undefined ? { name: opts.input.name } : {}),
      })
      .where(eq(List.id, opts.input.id));
  }),
});
