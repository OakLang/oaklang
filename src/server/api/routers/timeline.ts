import { FollowerTimelineItem, GlobalTimelineItem, User, UserFollow } from '~/server/schema';
import { UserMetricColumn, timelineItemToPublic, updateLastViewedTimestamp } from '~/utils/backend';
import { and, desc, eq, inArray, lt } from 'drizzle-orm';
import { createTRPCRouter, privateProcedure, publicProcedure } from '~/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { authenticatedUserFromRequest } from '~/utils/auth';
import { db } from '~/server/db';
import { timelineFilterOptions } from '~/utils/validators';
import { z } from 'zod';

export const timelineRouter = createTRPCRouter({
  getExploreTimelineFeed: publicProcedure
    .input(
      z.object({
        before: z
          .string()
          .datetime()
          .nullish()
          .transform((s) => (s ? new Date(s) : new Date())),
        cursor: z.number().int().min(0).max(999).default(0),
        filter: timelineFilterOptions.optional(),
      }),
    )
    .query(async ({ ctx, input: { before, cursor, filter } }) => {
      const limit = 10;

      const currentUser = await authenticatedUserFromRequest(ctx.req);
      if (currentUser) {
        await updateLastViewedTimestamp(currentUser, UserMetricColumn.lastViewedExploreAt);
      }

      const items = await db.query.GlobalTimelineItem.findMany({
        limit,
        offset: cursor * limit,
        orderBy: [desc(GlobalTimelineItem.postedAt), GlobalTimelineItem.id],
        where: and(
          lt(GlobalTimelineItem.createdAt, before),
          ...(filter?.integrations && filter.integrations.length > 0 ? [inArray(GlobalTimelineItem.provider, filter.integrations)] : []),
          ...(filter?.languages && filter.languages.length > 0 ? [inArray(GlobalTimelineItem.programLanguageName, filter.languages)] : []),
        ),
        with: { user: true },
      });

      return {
        items: await Promise.all(
          items.map(async (item) => {
            return await timelineItemToPublic(item, item.user);
          }),
        ),
        nextCursor: items.length == limit ? cursor + 1 : undefined,
      };
    }),
  getHomeTimelineFeed: privateProcedure
    .input(
      z.object({
        before: z
          .string()
          .datetime()
          .nullish()
          .transform((s) => (s ? new Date(s) : new Date())),
        cursor: z.number().int().min(0).max(999).default(0),
        filter: timelineFilterOptions.optional(),
      }),
    )
    .query(async ({ ctx, input: { cursor, before, filter } }) => {
      const { sessionId } = ctx;
      const limit = 10;

      const user = await authenticatedUserFromRequest(ctx.req, sessionId);
      if (!user) {
        return { items: [], nextCursor: undefined };
      }

      await updateLastViewedTimestamp(user, UserMetricColumn.lastViewedHomeAt);

      const items = await db.query.FollowerTimelineItem.findMany({
        limit,
        offset: cursor * limit,
        orderBy: [desc(FollowerTimelineItem.createdAt), desc(FollowerTimelineItem.postedAt), FollowerTimelineItem.globalTimelineItemId],
        where: and(
          lt(FollowerTimelineItem.createdAt, before),
          eq(FollowerTimelineItem.followerId, user.id),
          ...(filter?.integrations && filter.integrations.length > 0 ? [inArray(FollowerTimelineItem.provider, filter.integrations)] : []),
          ...(filter?.languages && filter.languages.length > 0
            ? [inArray(FollowerTimelineItem.programLanguageName, filter.languages)]
            : []),
        ),
        with: { globalTimelineItem: true, user: true },
      });

      const isFollowingAtLeastOne = await db.query.UserFollow.findFirst({
        where: eq(UserFollow.followedById, user.id),
      });

      return {
        followingNobody: !isFollowingAtLeastOne,
        items: await Promise.all(
          items.map(async (item) => {
            return await timelineItemToPublic(item.globalTimelineItem, item.user);
          }),
        ),
        nextCursor: items.length == limit ? cursor + 1 : undefined,
      };
    }),
  getProfileTimeline: publicProcedure
    .input(
      z.object({
        cursor: z.number().int().min(0).max(999).default(0),
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input: { cursor, userId } }) => {
      const user = await db.query.User.findFirst({ where: and(eq(User.id, userId), eq(User.isActive, true)) });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
      }

      const currentUser = await authenticatedUserFromRequest(ctx.req);
      if (currentUser) {
        await updateLastViewedTimestamp(
          currentUser,
          currentUser.id === user.id ? UserMetricColumn.lastViewedOwnProfileAt : UserMetricColumn.lastViewedOtherProfileAt,
        );
      }

      const limit = 10;

      const timelineItems = await db.query.GlobalTimelineItem.findMany({
        limit,
        offset: cursor * limit,
        orderBy: [desc(GlobalTimelineItem.postedAt), GlobalTimelineItem.id],
        where: eq(GlobalTimelineItem.userId, userId),
        with: { user: true },
      });

      return {
        items: await Promise.all(
          timelineItems.map(async (item) => {
            return await timelineItemToPublic(item, item.user);
          }),
        ),
        nextCursor: timelineItems.length === limit ? cursor + 1 : undefined,
      };
    }),
  getProgramLanguages: publicProcedure.query(() => {
    return db.query.ProgramLanguage.findMany();
  }),
});
