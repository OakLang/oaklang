import {
  AuditLog,
  GlobalTimelineItem,
  Integration,
  IntegrationHistoricalScore,
  IntegrationHistoricalStarredAt,
  List,
  ListFollower,
  ListMember,
  ProgramLanguage,
  SuggestFollowUser,
  User,
  UserFollow,
  UserMetric,
} from '~/server/schema';
import type { FeedItem, IntegrationConnection, InternalIntegration, OAuthToken, PublicList, PublicUser } from './types';
import type { IncomingMessage, ServerResponse } from 'http';
import { and, count, desc, eq, gt, inArray, isNotNull, isNull, lte, not, notInArray, or, sql } from 'drizzle-orm';
import { avatarForConnection, badgeInfoForConnection, nameForConnection } from '~/integrations/extensions/getters';
import { format, isDate, isValid, parse, subYears } from 'date-fns';
import { getIntegrationId, wonderfulFetch } from '~/integrations/utils';
import { AUDIT_LOG_USER_CONNECTED_INTEGRATION } from './constants';
import type { FollowerTimelineItem } from '~/server/schema';
import { ProfileDefault } from '~/server/schema';
import { alias } from 'drizzle-orm/pg-core';
import { createCSRFToken } from './csrf';
import { db } from '~/server/db';
import { getConnectionById } from '~/integrations/utils/backend';
import { responseJSON } from './validators';
import { scrapeIntegration } from '~/server/tasks/scrape/scrapeIntegration';
import { unstable_cache } from 'next/cache';
import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { getIPFromReq } from './get-ip';
import { authenticatedUserFromRequest, isAdminUserId } from './auth';

export const userToPublicUser = async (
  user: typeof User.$inferSelect,
  followersCount?: number,
  followingCount?: number,
): Promise<PublicUser> => {
  const gh = user.githubUser;
  return {
    avatarUrl: await getAvatarForUser(user),
    bio: user.bio,
    createdAt: user.createdAt,
    followersCount:
      followersCount ?? (await db.select({ value: count() }).from(UserFollow).where(eq(UserFollow.followingId, user.id)))[0]?.value ?? 0,
    followingCount:
      followingCount ?? (await db.select({ value: count() }).from(UserFollow).where(eq(UserFollow.followedById, user.id)))[0]?.value ?? 0,
    githubId: user.githubId!,
    githubProfileUrl: `https://github.com/${gh.login}`,
    githubUsername: gh.login,
    id: user.id,
    integrations: [],
    isAdmin: isAdminUserId(user.id),
    name: await getNameForUser(user),
    url: `/${user.username ?? user.id}`,
    username: user.username,
  };
};

export const getAvatarForUser = async (user: typeof User.$inferSelect): Promise<string> => {
  const gh = user.githubUser;
  let defaults = (user as unknown as { profileDefaults?: (typeof ProfileDefault.$inferSelect)[] }).profileDefaults;
  if (defaults === undefined) {
    defaults = await db.query.ProfileDefault.findMany({
      where: and(eq(ProfileDefault.userId, user.id), eq(ProfileDefault.defaultType, 'avatar')),
    });
  }
  const avatar = defaults.find((d) => d.defaultType == 'avatar') as
    | { integration?: typeof Integration.$inferSelect; integrationId: string }
    | undefined;
  if (avatar && !avatar.integration) {
    avatar.integration = await db.query.Integration.findFirst({ where: eq(Integration.id, avatar.integrationId) });
  }
  return avatarForConnection(avatar?.integration as unknown as IntegrationConnection) ?? gh.avatar_url;
};

export const getNameForUser = async (
  user: typeof User.$inferSelect & { profileDefaults?: (typeof ProfileDefault.$inferSelect)[] },
): Promise<string | null> => {
  const gh = user.githubUser;
  let defaults = user.profileDefaults;

  if (defaults === undefined) {
    defaults = await db.query.ProfileDefault.findMany({
      where: and(eq(ProfileDefault.userId, user.id), eq(ProfileDefault.defaultType, 'name')),
    });
  }
  const name = defaults.find((d) => d.defaultType == 'name') as
    | { integration?: typeof Integration.$inferSelect; integrationId: string }
    | undefined;

  if (name && !name.integration) {
    name.integration = await db.query.Integration.findFirst({ where: eq(Integration.id, name.integrationId) });
  }

  return nameForConnection(name?.integration as unknown as IntegrationConnection) ?? gh.name ?? null;
};

export const notFoundResponse = (res: ServerResponse<IncomingMessage>) => {
  res.writeHead(404);
  res.end();
  return { props: {} };
};

export const redirectResponse = (res: ServerResponse<IncomingMessage>, location: string) => {
  res.writeHead(302, { Location: location });
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', 0);
  res.end();
  return { props: {} };
};

export const connectIntegration = async (
  req: NextRequest,
  integration: InternalIntegration,
  user: typeof User.$inferSelect,
  userInfo: {
    info: unknown;
    uid: string;
    username: string;
  },
  token: OAuthToken,
) => {
  const provider = getIntegrationId(integration);
  const score = Math.floor(badgeInfoForConnection(undefined, userInfo.info, provider).score);

  const existing = await db.query.Integration.findFirst({
    where: and(eq(Integration.provider, provider), eq(Integration.userId, user.id), eq(Integration.providerAccountId, userInfo.uid)),
  });
  if (existing) {
    await db
      .update(Integration)
      .set({
        accessToken: token.access_token,
        expiresAt: token.expires_at,
        lastSyncUserInfoAt: new Date(),
        providerAccountScore: score,
        providerAccountUsername: userInfo.username,
        providerInfo: userInfo.info,
        refreshToken: token.refresh_token,
      })
      .where(and(eq(Integration.id, existing.id), eq(Integration.provider, provider), eq(Integration.userId, user.id)));
    await scrapeIntegration.enqueue(existing.id);

    return false;
  }

  const connection = (
    await db
      .insert(Integration)
      .values({
        accessToken: token.access_token,
        expiresAt: token.expires_at,
        lastSyncUserInfoAt: new Date(),
        provider: provider,
        providerAccountId: userInfo.uid,
        providerAccountScore: score,
        providerAccountUsername: userInfo.username,
        providerInfo: userInfo.info,
        refreshToken: token.refresh_token,
        scopes: [],
        userId: user.id,
      })
      .onConflictDoUpdate({
        set: {
          accessToken: token.access_token,
          expiresAt: token.expires_at,
          lastSyncUserInfoAt: new Date(),
          providerAccountScore: score,
          providerAccountUsername: userInfo.username,
          providerInfo: userInfo.info,
          refreshToken: token.refresh_token,
        },
        target: Integration.id,
      })
      .returning({ id: Integration.id })
  )[0];

  if (connection?.id) {
    await db.insert(AuditLog).values({
      event: AUDIT_LOG_USER_CONNECTED_INTEGRATION,
      ip: getIPFromReq(req),
      metadata: { provider, uid: userInfo.uid, username: userInfo.username },
      userAgent: req.headers.get('user-agent'),
      userId: user.id,
    });
  }

  if (!integration.postInstallUrl) {
    await scrapeIntegration.enqueue(connection?.id);
  }

  return true;
};

export const integrationParams = async (integrationId: unknown, jobId?: unknown) => {
  const result = z.string().safeParse(integrationId);
  if (!result.success) {
    throw new Error(result.error.message);
  }

  const jobIdResult = z.string().safeParse(jobId);
  const job = jobIdResult.success ? jobIdResult.data : createCSRFToken(30);

  const connection = await getConnectionById(result.data);

  return { connection, job };
};

export const timelineItemToPublic = async (
  item: typeof GlobalTimelineItem.$inferSelect,
  user: typeof User.$inferSelect,
  followerItem?: typeof FollowerTimelineItem.$inferSelect,
): Promise<FeedItem> => {
  return {
    createdAt: item.createdAt,
    description: item.description,
    eventType: item.eventType,
    id: item.id,
    integrationId: item.integrationId,
    postedAt: item.postedAt,
    programLanguageColor: item.programLanguageName ? await getCachedLanguageColor(item.programLanguageName) : null,
    programLanguageName: item.programLanguageName,
    provider: item.provider,
    score: item.score,
    subtitle: item.subtitle,
    title: item.title,
    user: await userToPublicUser(user),
    viewedAt: followerItem ? followerItem.viewedAt ?? null : null,
  };
};

export const getCachedLanguage = unstable_cache(
  async (name: string) => {
    return await db.query.ProgramLanguage.findFirst({ where: eq(ProgramLanguage.name, name) });
  },
  ['program-language'],
);

export const getCachedLanguageColor = async (name: string) => {
  const lang = await getCachedLanguage(name);
  return lang ? lang.color : null;
};

export const getCachedLanguageName = async (name: string) => {
  const lang = await getCachedLanguage(name);
  return lang ? lang.name : null;
};

export const doesUserFollowUser = async (followingId: string, followedById: string) => {
  if (followingId === followedById) {
    return false;
  }

  return (
    (
      await db
        .select()
        .from(UserFollow)
        .where(and(eq(UserFollow.followedById, followedById), eq(UserFollow.followingId, followingId)))
    ).length > 0
  );
};

export const getFriendsOfFriends = async (
  users: PublicUser[],
  user: typeof User.$inferSelect,
  limit: number,
  currentUser?: typeof User.$inferSelect | null,
) => {
  const Followings = db.$with('Followings').as(db.select().from(UserFollow).where(eq(UserFollow.followedById, user.id)));
  const uf1 = alias(UserFollow, 'uf1');
  const uf2 = alias(UserFollow, 'uf2');
  const FollowingsFollowings = db
    .$with('FollowingsFollowings')
    .as(
      db
        .select({ followingId: uf2.followingId })
        .from(uf1)
        .innerJoin(uf2, eq(uf1.followingId, uf2.followedById))
        .where(eq(uf1.followedById, user.id)),
    );

  const UserIntegrations = db.$with('UserIntegrations').as(
    db
      .select({
        totalScore: sql<number>`cast(sum(${Integration.providerAccountScore}) as int)`.as('totalScore'),
        userId: Integration.userId,
      })
      .from(Integration)
      .groupBy(Integration.userId),
  );

  let query = db
    .with(Followings, FollowingsFollowings, UserIntegrations)
    .select({ user: User })
    .from(User)
    .leftJoin(Followings, eq(User.id, Followings.followingId))
    .leftJoin(FollowingsFollowings, eq(User.id, FollowingsFollowings.followingId))
    .leftJoin(UserIntegrations, eq(User.id, UserIntegrations.userId));

  if (currentUser) {
    query = query.leftJoin(UserFollow, and(eq(User.id, UserFollow.followingId), eq(UserFollow.followedById, currentUser.id)));
  }

  const suggestedUsers = await query
    .where(
      and(
        eq(User.isActive, true),
        not(eq(User.id, user.id)),
        or(not(isNull(Followings.followingId)), not(isNull(FollowingsFollowings.followingId))),
        not(isNull(UserIntegrations.userId)),
        gt(UserIntegrations.totalScore, 0),
        ...(currentUser ? [not(eq(User.id, currentUser.id))] : []),
        ...(currentUser ? [or(not(eq(UserFollow.followedById, currentUser.id)), isNull(UserFollow.followedById))] : []),
        ...(users.length > 0
          ? [
              notInArray(
                User.id,
                users.map((user) => user.id),
              ),
            ]
          : []),
      ),
    )
    .orderBy(desc(UserIntegrations.totalScore), desc(User.createdAt))
    .limit(limit)
    .then((results) => {
      const u = results.map((row) => row.user);
      return u.filter((user, i) => u.findIndex((item) => item.id === user.id) === i);
    });

  return Promise.all(
    suggestedUsers.map(async (user) => {
      const publicUser = await userToPublicUser(user);
      const doesFollowMe = currentUser
        ? (
            await db
              .select()
              .from(UserFollow)
              .where(and(eq(UserFollow.followedById, user.id), eq(UserFollow.followingId, currentUser.id)))
          ).length > 0
        : false;
      return { ...publicUser, doesFollowMe };
    }),
  );
};

export const getTopUserSuggestions = async (users: PublicUser[], limit: number, currentUser?: typeof User.$inferSelect | null) => {
  // TODO: if we have currentUser, filter by SuggestFollowUser.firstProgramLanguageName matching the current user's top languages

  let query = db.select({ user: User }).from(User).leftJoin(SuggestFollowUser, eq(User.id, SuggestFollowUser.userId));

  if (currentUser) {
    query = query.leftJoin(UserFollow, and(eq(User.id, UserFollow.followingId), eq(UserFollow.followedById, currentUser.id)));
  }

  const suggestedUsers = await query
    .where(
      and(
        eq(User.isActive, true),
        gt(SuggestFollowUser.integrationMaxScore, 0),
        ...(currentUser ? [not(eq(User.id, currentUser.id))] : []),
        ...(currentUser ? [or(not(eq(UserFollow.followedById, currentUser.id)), isNull(UserFollow.followedById))] : []),
        ...(users.length > 0
          ? [
              notInArray(
                User.id,
                users.map((user) => user.id),
              ),
            ]
          : []),
      ),
    )
    .orderBy(desc(SuggestFollowUser.integrationMaxScore), SuggestFollowUser.userId)
    .limit(limit);

  return await Promise.all(
    suggestedUsers.map(async (row) => {
      const publicUser = await userToPublicUser(row.user);
      const doesFollowMe = currentUser
        ? (
            await db
              .select()
              .from(UserFollow)
              .where(and(eq(UserFollow.followedById, row.user.id), eq(UserFollow.followingId, currentUser.id)))
          ).length > 0
        : false;
      return { ...publicUser, doesFollowMe };
    }),
  );
};

export enum UserMetricColumn {
  lastViewedExploreAt = 'lastViewedExploreAt',
  lastViewedHomeAt = 'lastViewedHomeAt',
  lastViewedLeadersAt = 'lastViewedLeadersAt',
  lastViewedLeadersSubpageAt = 'lastViewedLeadersSubpageAt',
  lastViewedOtherProfileAt = 'lastViewedOtherProfileAt',
  lastViewedOwnProfileAt = 'lastViewedOwnProfileAt',
}

export const updateLastViewedTimestamp = async (currentUser: typeof User.$inferSelect, column: UserMetricColumn) => {
  const values = { [column]: new Date() };
  await db
    .insert(UserMetric)
    .values({ id: currentUser.id, ...values })
    .onConflictDoUpdate({ set: values, target: UserMetric.id });
};

export const getLeadersQuery = (
  provider: string,
  filter:
    | {
        languages?: string[] | null | undefined;
      }
    | undefined,
  limit: number,
  cursor: number,
) => {
  const UserIntegrations = db.$with('UserIntegrations').as(
    db
      .select({
        totalScore: sql<number>`cast(sum(${Integration.providerAccountScore}) as int)`.as('totalScore'),
        userId: Integration.userId,
      })
      .from(Integration)
      .where(eq(Integration.provider, provider))
      .groupBy(Integration.userId),
  );

  if ((filter?.languages ?? []).length > 0) {
    const Timeline = db.$with('Timeline').as(
      db
        .select({ userId: GlobalTimelineItem.userId })
        .from(GlobalTimelineItem)
        .where(
          and(
            inArray(GlobalTimelineItem.programLanguageName, filter!.languages!),
            gt(GlobalTimelineItem.postedAt, subYears(new Date(), 10)),
          ),
        )
        .groupBy(GlobalTimelineItem.userId),
    );
    return db
      .with(UserIntegrations, Timeline)
      .select({ totalScore: UserIntegrations.totalScore, user: User })
      .from(User)
      .leftJoin(UserIntegrations, eq(User.id, UserIntegrations.userId))
      .leftJoin(Timeline, eq(User.id, Timeline.userId))
      .leftJoin(Integration, and(eq(User.id, Integration.userId), eq(User.isActive, true)))
      .where(
        and(eq(User.isActive, true), isNotNull(UserIntegrations.userId), gt(UserIntegrations.totalScore, 0), isNotNull(Timeline.userId)),
      )
      .orderBy(desc(UserIntegrations.totalScore), desc(User.createdAt))
      .limit(limit)
      .offset(limit * cursor);
  }

  return db
    .with(UserIntegrations)
    .select({ totalScore: UserIntegrations.totalScore, user: User })
    .from(User)
    .leftJoin(UserIntegrations, eq(User.id, UserIntegrations.userId))
    .where(and(eq(User.isActive, true), isNotNull(UserIntegrations.userId), gt(UserIntegrations.totalScore, 0)))
    .orderBy(desc(UserIntegrations.totalScore), desc(User.createdAt))
    .limit(limit)
    .offset(limit * cursor);
};

export const getList = async (
  listId: string,
  req: NextRequest,
  sessionId?: string,
  followersCount?: number,
  membersCount?: number,
): Promise<PublicList | null> => {
  const list = await db.query.List.findFirst({
    where: and(eq(List.id, listId), eq(List.isActive, true)),
    with: { user: true },
  });

  if (!list) {
    return null;
  }

  if (list.isPrivate) {
    // check if user is a member of the list
    const currentUser = (await authenticatedUserFromRequest(req, sessionId)) as PublicUser | null;
    if (!currentUser) {
      return null;
    }

    if (list.userId !== currentUser.id) {
      const isMember = await db.query.ListMember.findFirst({
        where: and(eq(ListMember.listId, listId), eq(ListMember.userId, currentUser.id)),
      });

      if (!isMember) {
        return null;
      }
    }
  }

  return {
    ...list,
    followersCount: followersCount ?? (await getListFollowerCount(listId)),
    membersCount: membersCount ?? (await getListMemberCount(listId)),
    user: await userToPublicUser(list.user),
  };
};

export const listToPublicList = async (
  list: typeof List.$inferSelect,
  followersCount?: number,
  membersCount?: number,
): Promise<PublicList> => {
  const user = await db.query.User.findFirst({ where: and(eq(User.isActive, true), eq(User.id, list.userId)) });
  if (!user) {
    throw new Error('User not found!');
  }
  return {
    ...list,
    followersCount: followersCount ?? (await getListFollowerCount(list.id)),
    membersCount: membersCount ?? (await getListMemberCount(list.id)),
    user: await userToPublicUser(user),
  };
};

export const getListMemberCount = async (listId: string) => {
  const result = await db.select({ count: count() }).from(ListMember).where(eq(ListMember.listId, listId));
  return result[0]?.count ?? 0;
};

export const getListFollowerCount = async (listId: string) => {
  const result = await db.select({ count: count() }).from(ListFollower).where(eq(ListFollower.listId, listId));
  return result[0]?.count ?? 0;
};

export const getRepoStarsAtTimeInPast = async (provider: string, repoFullName: string, at: Date) => {
  return (
    (
      await db
        .select({ value: count() })
        .from(IntegrationHistoricalStarredAt)
        .where(
          and(
            eq(IntegrationHistoricalStarredAt.provider, provider),
            eq(IntegrationHistoricalStarredAt.repoFullName, repoFullName),
            lte(IntegrationHistoricalStarredAt.starredAt, at),
          ),
        )
    )[0]?.value ?? 0
  );
};

export const getScoreAtTimeInPast = async (connection: typeof Integration.$inferSelect, at: Date) => {
  return (
    (
      await db.query.IntegrationHistoricalScore.findFirst({
        orderBy: [desc(IntegrationHistoricalScore.date)],
        where: and(
          eq(IntegrationHistoricalScore.provider, connection.provider),
          eq(IntegrationHistoricalScore.providerAccountId, connection.providerAccountId),
          lte(IntegrationHistoricalScore.date, at),
        ),
      })
    )?.score ?? 0
  );
};

// https://archive.org/wayback/available?url=github.com/alanhamlett&timestamp=20240101
export const fetchWayBackMachineArchiveUrl = async (url: string, nearby: Date) => {
  url = url.replace(/^https?:\/\//, '');
  const timestamp = format(nearby, 'yyyyMMdd');
  const params = new URLSearchParams({ timestamp, url });
  const resp = await wonderfulFetch(`https://archive.org/wayback/available?${params.toString()}`, { timeout: 30 });
  if (resp.status !== 200) {
    return;
  }
  const archive = (
    (await responseJSON(resp, {})) as {
      archived_snapshots?: {
        closest?: {
          available: boolean;
          status: string;
          timestamp: string;
          url: string;
        };
      };
    }
  ).archived_snapshots?.closest;
  if (!archive || archive.status !== '200' || !archive.available) {
    return;
  }

  const archivedAt = parse(archive.timestamp, 'yyyyMMddHHmmss', new Date());
  if (!isDate(archivedAt) || !isValid(archivedAt)) {
    return;
  }
  return {
    available: archive.available,
    status: archive.status,
    timestamp: archivedAt,
    url: archive.url,
  };
};
