import { AUDIT_LOG_USER_DISCONNECTED_INTEGRATION, NODE_ENV } from '~/utils/constants';
import { AuditLog, Integration, IntegrationManualToken, IntegrationScrape, User } from '~/server/schema';
import type { GitHubRepoScrape, IntegrationWithConnections, OAuthToken, PublicConnection } from '~/utils/types';
import {
  UserMetricColumn,
  connectIntegration,
  doesUserFollowUser,
  getLeadersQuery,
  updateLastViewedTimestamp,
  userToPublicUser,
} from '~/utils/backend';
import { and, desc, eq, gt, isNotNull, sql } from 'drizzle-orm';
import { avatarForConnection, badgeInfoForProviderScore, nameForConnection, urlForConnection } from '~/integrations/extensions/getters';
import { createTRPCRouter, privateProcedure, publicProcedure } from '~/server/api/trpc';
import { getIntegrationId, getIntegrationIdFromName, getOAuthUrl } from '~/integrations/utils';
import { TRPCError } from '@trpc/server';
import { db } from '~/server/db';
import { generateProfileBio } from '~/server/tasks/generateProfileBio';
import { integrations } from '~/integrations/list';
import { leadersFilterOptions } from '~/utils/validators';
import { revokeAccessToken } from '~/integrations/utils/defaultHandlers';
import { siYcombinator } from 'simple-icons';
import { z } from 'zod';
import { getIPFromReq } from '~/utils/get-ip';
import { authenticatedUserFromRequest } from '~/utils/auth';

export const integrationsRouter = createTRPCRouter({
  allIntegrationsForUser: privateProcedure.query(async ({ ctx }) => {
    const { req, sessionId } = ctx;

    const user = await db.query.User.findFirst({
      where: and(eq(User.isActive, true), eq(User.sessionId, sessionId)),
      with: {
        integrations: true,
      },
    });
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found!' });
    }

    const data: IntegrationWithConnections[] = integrations
      .filter((i) => !i.isHidden || NODE_ENV === 'development')
      .map((integration) => {
        const connections = user.integrations
          .filter((i) => {
            return i.provider === getIntegrationIdFromName(integration.name);
          })
          .map((connection) => {
            return {
              avatar: avatarForConnection(undefined, connection.providerInfo, connection.provider),
              badgeText: '',
              id: connection.id,
              provider: connection.provider,
              providerAccountId: connection.providerAccountId,
              providerAccountUsername: connection.providerAccountUsername,
              url: urlForConnection(connection),
            };
          });
        return {
          ...integration,
          connections: connections,
          isConnected: connections.length > 0,
          oauthUrl: getOAuthUrl(integration, req),
        };
      })
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    return data;
  }),
  disconnectIntegration: privateProcedure
    .input(z.object({ connectionId: z.string().optional(), provider: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { req, sessionId } = ctx;

      const provider = getIntegrationIdFromName(input.provider);
      if (!provider) {
        return;
      }

      const user = await db.query.User.findFirst({
        where: and(eq(User.isActive, true), eq(User.sessionId, sessionId)),
        with: {
          integrations: true,
        },
      });
      if (!user) {
        return null;
      }

      const connections = user.integrations.filter((c) => {
        if (c.provider !== provider) {
          return false;
        }
        return !input.connectionId || input.connectionId === c.id;
      });
      if (connections.length === 0) {
        return;
      }

      await Promise.all(
        connections.map(async (c) => {
          if (!c.accessToken) {
            return;
          }
          await revokeAccessToken(c, c.accessToken);
        }),
      );

      if (input.connectionId) {
        await db
          .delete(Integration)
          .where(and(eq(Integration.provider, provider), eq(Integration.id, input.connectionId), eq(Integration.userId, user.id)));
      } else {
        await db.delete(Integration).where(and(eq(Integration.provider, provider), eq(Integration.userId, user.id)));
      }

      await db.insert(AuditLog).values({
        event: AUDIT_LOG_USER_DISCONNECTED_INTEGRATION,
        ip: getIPFromReq(req),
        metadata: { connectionId: input.connectionId, provider: provider },
        userAgent: req.headers.get('user-agent'),
        userId: user.id,
      });
    }),
  generateSecondBio: privateProcedure.mutation(async ({ ctx }) => {
    const { sessionId } = ctx;

    const user = await db.query.User.findFirst({
      where: and(eq(User.isActive, true), eq(User.sessionId, sessionId)),
    });
    if (!user) {
      return;
    }

    await generateProfileBio.enqueue(user.id);
  }),
  getRepos: privateProcedure.input(z.object({ provider: z.string() })).query(async (opts) => {
    const user = await db.query.User.findFirst({ where: and(eq(User.isActive, true), eq(User.sessionId, opts.ctx.sessionId)) });
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const scrapes = await db.query.IntegrationScrape.findMany({
      where: and(
        eq(IntegrationScrape.provider, opts.input.provider),
        eq(IntegrationScrape.userId, user.id),
        eq(IntegrationScrape.scrapeType, 'repos'),
      ),
    });

    const repos = scrapes.flatMap((scrape) => (scrape.jsonValue as { repos?: GitHubRepoScrape[] }).repos ?? []);
    return repos.map((repo) => ({
      ...repo,
      namespace: repo.full_name.split('/')[0]!,
      repoName: repo.full_name.split('/')[1]!,
    }));
  }),
  integrationForUser: privateProcedure.input(z.object({ provider: z.string() })).query(async (opts) => {
    const currentUser = await authenticatedUserFromRequest(opts.ctx.req);
    if (!currentUser) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const integration = integrations.find((integration) => opts.input.provider === getIntegrationIdFromName(integration.name));

    if (!integration) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not found!' });
    }

    const userIntegrations = await db.query.Integration.findMany({
      where: and(eq(Integration.userId, currentUser.id), eq(Integration.provider, opts.input.provider)),
    });

    const connections = userIntegrations.map((connection) => {
      return {
        avatar: avatarForConnection(undefined, connection.providerInfo, connection.provider),
        badgeText: '',
        createdAt: connection.createdAt,
        id: connection.id,
        name: nameForConnection(undefined, connection.providerInfo, connection.provider),
        provider: connection.provider,
        providerAccountId: connection.providerAccountId,
        providerAccountUsername: connection.providerAccountUsername,
        url: urlForConnection(connection),
      } satisfies PublicConnection;
    });

    return {
      ...integration,
      connections,
      isConnected: connections.length > 0,
      oauthUrl: getOAuthUrl(integration, opts.ctx.req),
    };
  }),
  manualIntegrationInfo: privateProcedure
    .input(z.object({ provider: z.string(), username: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { req, sessionId } = ctx;

      const { username } = input;
      if (!username.trim()) {
        return { link: null, token: null };
      }

      const provider = getIntegrationIdFromName(input.provider);
      if (!provider) {
        return { link: null, token: null };
      }

      let link: string | null = null;
      switch (provider) {
        case getIntegrationIdFromName(siYcombinator.title):
          link = `https://news.ycombinator.com/user?id=${username}`;
          break;
      }
      if (!link) {
        return { link: null, token: null };
      }

      const user = await authenticatedUserFromRequest(req, sessionId);
      if (!user) {
        return { link, token: null };
      }

      const token = (
        await db
          .insert(IntegrationManualToken)
          .values({
            provider: provider,
            userId: user.id,
          })
          .onConflictDoNothing()
          .returning()
      )[0];
      if (token?.id) {
        return { link, token: `wonderfuldev_${token.id}` };
      }

      const t = await db.query.IntegrationManualToken.findFirst({
        where: and(eq(IntegrationManualToken.provider, provider), eq(IntegrationManualToken.userId, user.id)),
      });
      if (t) {
        return { link, token: `wonderfuldev_${t.id}` };
      }

      return { link, token: null };
    }),
  topIntegrations: publicProcedure.query(async ({ ctx }) => {
    const currentUser = await authenticatedUserFromRequest(ctx.req);
    if (currentUser) {
      await updateLastViewedTimestamp(currentUser, UserMetricColumn.lastViewedLeadersAt);
    }

    return (
      await Promise.all(
        integrations.map(async (i) => {
          const provider = getIntegrationIdFromName(i.name);
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
          const users = await db
            .with(UserIntegrations)
            .select({ totalScore: UserIntegrations.totalScore, user: User })
            .from(User)
            .leftJoin(UserIntegrations, eq(User.id, UserIntegrations.userId))
            .where(and(eq(User.isActive, true), isNotNull(UserIntegrations.userId), gt(UserIntegrations.totalScore, 0)))
            .orderBy(desc(UserIntegrations.totalScore), desc(User.createdAt))
            .limit(3);

          return {
            id: getIntegrationIdFromName(i.name),
            integration: i,
            users: await Promise.all(
              users.map(async (row) => {
                return {
                  ...badgeInfoForProviderScore(provider, row.totalScore),
                  totalScore: row.totalScore,
                  user: await userToPublicUser(row.user),
                };
              }),
            ),
          };
        }),
      )
    ).sort((a, b) => (b.users[0]?.totalScore ?? -1) - (a.users[0]?.totalScore ?? -1));
  }),
  topUsersForIntegration: publicProcedure
    .input(
      z.object({
        cursor: z.number().int().min(0).max(999).default(0),
        filter: leadersFilterOptions.optional(),
        provider: z.string().nullish(),
      }),
    )
    .query(async ({ input: { provider, cursor, filter }, ctx }) => {
      provider = getIntegrationIdFromName(provider ?? '');
      if (!provider) {
        return {
          items: [],
          nextCursor: undefined,
        };
      }

      const limit = 10;

      const currentUser = await authenticatedUserFromRequest(ctx.req);
      if (currentUser) {
        await updateLastViewedTimestamp(currentUser, UserMetricColumn.lastViewedLeadersSubpageAt);
      }

      const query = getLeadersQuery(provider, filter, limit, cursor);

      const items = await Promise.all(
        (await query).map(async (row) => {
          const publicUser = await userToPublicUser(row.user);
          const doesFollowMe = !!currentUser && (await doesUserFollowUser(currentUser.id, row.user.id));
          const isFollowing = !!currentUser && (await doesUserFollowUser(row.user.id, currentUser.id));
          return {
            ...badgeInfoForProviderScore(provider!, row.totalScore),
            ...publicUser,
            doesFollowMe,
            isFollowing,
          };
        }),
      );

      return {
        items: items,
        nextCursor: items.length == limit ? cursor + 1 : undefined,
      };
    }),

  verifyManualIntegration: privateProcedure
    .input(z.object({ provider: z.string(), username: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { req, sessionId } = ctx;

      const { username } = input;
      if (!username.trim()) {
        return { error: true };
      }

      const provider = getIntegrationIdFromName(input.provider);
      if (!provider) {
        return { error: true };
      }

      const integration = integrations.find((i) => {
        return getIntegrationId(i) === provider;
      });
      if (!integration?.isManualValidation) {
        return { error: true };
      }

      const user = await authenticatedUserFromRequest(req, sessionId);
      if (!user) {
        return { error: true };
      }

      const token = await db.query.IntegrationManualToken.findFirst({
        where: and(eq(IntegrationManualToken.provider, provider), eq(IntegrationManualToken.userId, user.id)),
      });
      if (!token) {
        return { error: true };
      }

      const secret = `wonderfuldev_${token.id}`;

      const userInfo = await integration.userInfoHandler(integration, secret, { manualData: { username: username.trim() } });
      const { error } = userInfo;
      if (error ?? !userInfo.info) {
        console.log(`Unable to get ${provider} user info.`);
        return { error: true };
      }

      const fakeToken: OAuthToken = { access_token: secret };
      // TODO: Change Request to NextRequest
      await connectIntegration(req, integration, user, userInfo, fakeToken);
      await db.delete(IntegrationManualToken).where(eq(IntegrationManualToken.id, secret));
      return { ok: true };
    }),
});
