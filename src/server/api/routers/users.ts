/* eslint-disable max-lines */
import {
  AUDIT_LOG_FOLLOWED_USER,
  AUDIT_LOG_UNFOLLOWED_USER,
  AUDIT_LOG_USERNAME_CHANGED,
  AUDIT_LOG_USER_PROFILE_BIO_CHANGED,
  AUDIT_LOG_USER_PROFILE_DEFAULT_CHANGED,
  CLAIM_USERNAME_COOKIE,
} from '~/utils/constants';
import { AuditLog, Badge, FollowerTimelineItem, Integration, OpenaiResult, ProfileDefault, User, UserFollow } from '~/server/schema';
import type { IntegrationConnection, PublicUser } from '~/utils/types';
import { and, count, desc, eq } from 'drizzle-orm';
import {
  avatarForConnection,
  badgeInfoForConnection,
  badgeInfoForIntegration,
  nameForConnection,
  subConnectionsForConnection,
  urlForConnection,
} from '~/integrations/extensions/getters';
import { createTRPCRouter, privateProcedure, publicProcedure } from '~/server/api/trpc';
import { doesUserFollowUser, getFriendsOfFriends, getTopUserSuggestions, userToPublicUser } from '~/utils/backend';
import { validateId, validateUserProfileDefaultType, validateUsername } from '~/utils/validators';
import type { ChatCompletion } from 'openai/resources';
import { TRPCError } from '@trpc/server';
import { afterFollowingUser } from '~/server/tasks/afterFollowingUser';
import { createCSRFToken } from '~/utils/csrf';
import { db } from '~/server/db';
import { getIntegrationIdFromName } from '~/integrations/utils';
import { integrations } from '~/integrations/list';
import { pagify } from '~/utils/helpers';
import { parseBioFromGPT } from '~/integrations/utils/backend';
import { z } from 'zod';
import { getIPFromReq } from '~/utils/get-ip';
import { cookies } from 'next/headers';
import { authenticatedUserFromRequest, getUserByUsernameAndRequest } from '~/utils/auth';

export const usersRouter = createTRPCRouter({
  claimUsername: publicProcedure.input(z.string()).mutation(async ({ input }) => {
    const user = await db.query.User.findFirst({
      where: eq(User.username, input),
    });

    if (user) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Username not available.',
      });
    }
    cookies().set(CLAIM_USERNAME_COOKIE, input, { maxAge: 0 });
  }),
  findByUsername: publicProcedure.input(z.string()).query(async ({ input }) => {
    const user = await db.query.User.findFirst({
      where: and(eq(User.isActive, true), eq(User.username, input)),
    });
    if (!user) {
      return null;
    }

    return userToPublicUser(user);
  }),
  followUser: privateProcedure.input(z.string()).mutation(async ({ ctx, input: userId }) => {
    const { req, sessionId } = ctx;

    const currentUser = await authenticatedUserFromRequest(req, sessionId);
    if (!currentUser) {
      return;
    }

    const followUser = await db.query.User.findFirst({
      where: and(eq(User.isActive, true), eq(User.id, userId)),
    });
    if (!followUser) {
      return;
    }

    if (currentUser.id == followUser.id) {
      return false;
    }

    const insertId = createCSRFToken();
    const result = await db
      .insert(UserFollow)
      .values({
        followedById: currentUser.id,
        followingId: followUser.id,
        insertId,
      })
      .onConflictDoNothing()
      .returning({ insertId: UserFollow.insertId });
    if (result[0]?.insertId === insertId) {
      await db.insert(AuditLog).values({
        event: AUDIT_LOG_FOLLOWED_USER,
        ip: getIPFromReq(req),
        metadata: { followingId: followUser.id },
        userAgent: req.headers.get('user-agent'),
        userId: currentUser.id,
      });
      await afterFollowingUser.enqueue({
        followerUserId: currentUser.id,
        followingUserId: followUser.id,
      });
    }
  }),
  getBadges: publicProcedure.input(z.string()).query(async ({ input }) => {
    const user = await db.query.User.findFirst({
      where: and(eq(User.isActive, true), eq(User.id, input)),
    });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
    }

    return await db.query.Badge.findMany({
      where: eq(Badge.userId, user.id),
    });
  }),
  getFollowers: publicProcedure
    .input(z.object({ cursor: z.number().int().min(0).max(999).default(0), userId: z.string() }))
    .query(async ({ ctx, input: { userId, cursor } }) => {
      const currentUser = await authenticatedUserFromRequest(ctx.req);

      const limit = 10;
      const user = await db.query.User.findFirst({
        where: and(eq(User.isActive, true), eq(User.id, userId)),
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found!' });
      }

      const items = await db.query.UserFollow.findMany({
        limit,
        offset: cursor * limit,
        orderBy: [desc(UserFollow.createdAt)],
        where: eq(UserFollow.followingId, user.id),
        with: { followedBy: { with: { profileDefaults: true } } },
      });

      return {
        items: await Promise.all(
          items.map(async ({ followedBy }) => {
            const publicUser = await userToPublicUser(followedBy, 0, 0);
            const doesFollowMe = !!currentUser && (await doesUserFollowUser(currentUser.id, followedBy.id));
            const isFollowing = !!currentUser && (await doesUserFollowUser(followedBy.id, currentUser.id));
            return {
              ...publicUser,
              doesFollowMe,
              isFollowing,
            };
          }),
        ),
        nextCursor: items.length == limit ? cursor + 1 : undefined,
      };
    }),
  getFollowing: publicProcedure
    .input(
      z.object({
        cursor: z.number().int().min(0).max(999).default(0),
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input: { userId, cursor } }) => {
      const currentUser = await authenticatedUserFromRequest(ctx.req);
      const limit = 10;
      const user = await db.query.User.findFirst({
        where: and(eq(User.isActive, true), eq(User.id, userId)),
      });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found!' });
      }

      const items = await db.query.UserFollow.findMany({
        limit,
        offset: cursor * limit,
        orderBy: [desc(UserFollow.createdAt)],
        where: eq(UserFollow.followedById, user.id),
        with: { following: { with: { profileDefaults: true } } },
      });

      return {
        items: await Promise.all(
          items.map(async ({ following }) => {
            const publicUser = await userToPublicUser(following, 0, 0);
            const doesFollowMe = !!currentUser && (await doesUserFollowUser(currentUser.id, following.id));
            const isFollowing = !!currentUser && (await doesUserFollowUser(following.id, currentUser.id));
            return {
              ...publicUser,
              doesFollowMe,
              isFollowing,
            };
          }),
        ),
        nextCursor: items.length === limit ? cursor + 1 : undefined,
      };
    }),
  getIntegrations: publicProcedure.input(z.object({ userId: z.string() })).query(async (opts) => {
    const user = await getUserByUsernameAndRequest(opts.input.userId, opts.ctx.req, {
      profileDefaults: { with: { integration: true } },
    });
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found!' });
    }
    const connections = await db.query.Integration.findMany({
      where: eq(Integration.userId, opts.input.userId),
    });

    const currentUser = await authenticatedUserFromRequest(opts.ctx.req);
    if (!currentUser || currentUser.id !== user.id) {
      return Promise.all(
        integrations
          .map((integration) => {
            const provider = getIntegrationIdFromName(integration.name);
            const { badgeText, score } = badgeInfoForIntegration(
              integration,
              connections.filter((c) => {
                return c.provider == provider;
              }),
            );

            return {
              badgeText: badgeText,
              connections: connections
                .filter((c) => {
                  return c.provider == provider;
                })
                .map((c) => {
                  const info = badgeInfoForConnection(c);
                  return {
                    avatar: avatarForConnection(c as unknown as IntegrationConnection),
                    badgeText: info.badgeText,
                    id: c.id,
                    name: nameForConnection(c as unknown as IntegrationConnection),
                    provider: c.provider,
                    providerAccountUsername: c.providerAccountUsername,
                    score: info.score,
                    subConnections: subConnectionsForConnection(c),
                    url: urlForConnection(c),
                  };
                }),
              icon: integration.icon ?? '',
              name: integration.name,
              score: score,
            };
          })
          .filter((integration) => {
            return integration.connections.length > 0;
          })
          .sort((a, b) => {
            return b.score - a.score;
          }),
      );
    }

    const defaults = await db.query.ProfileDefault.findMany({
      where: eq(ProfileDefault.userId, user.id),
    });
    return Promise.all(
      integrations
        .map((integration) => {
          const provider = getIntegrationIdFromName(integration.name);
          const { badgeText, score } = badgeInfoForIntegration(
            integration,
            connections.filter((c) => {
              return c.provider == provider;
            }),
          );

          return {
            badgeText: badgeText,
            connections: connections
              .filter((c) => {
                return c.provider == provider;
              })
              .map((c) => {
                const info = badgeInfoForConnection(c);
                return {
                  avatar: avatarForConnection(c as unknown as IntegrationConnection),
                  badgeText: info.badgeText,
                  id: c.id,
                  name: nameForConnection(c as unknown as IntegrationConnection),
                  provider: c.provider,
                  providerAccountId: c.providerAccountId,
                  providerAccountUsername: c.providerAccountUsername,
                  providerInfo: c.providerInfo,
                  score: info.score,
                  subConnections: subConnectionsForConnection(c),
                  url: urlForConnection(c),
                };
              }),
            icon: integration.icon ?? '',
            name: integration.name,
            profileDefaults: defaults.filter((d) => {
              return !!connections.find((c) => {
                return c.provider == provider && d.integrationId == c.id;
              });
            }),
            score: score,
          };
        })
        .filter((integration) => {
          return integration.connections.length > 0;
        })
        .sort((a, b) => {
          return b.score - a.score;
        }),
    );
  }),
  getSuggestedUsers: publicProcedure
    .input(z.object({ limit: z.number().min(3).max(30), userId: z.string().optional() }))
    .query(async (opts) => {
      const currentUser = await authenticatedUserFromRequest(opts.ctx.req);

      const users: (PublicUser & { doesFollowMe: boolean })[] = [];

      // suggested followers when viewing a public profile
      if (opts.input.userId && (!currentUser || currentUser.id !== opts.input.userId)) {
        const user = await db.query.User.findFirst({ where: and(eq(User.isActive, true), eq(User.id, opts.input.userId)) });
        if (!user) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
        }

        users.push(...(await getFriendsOfFriends(users, user, opts.input.limit - 1, currentUser)));
      }

      if (currentUser) {
        users.push(...(await getFriendsOfFriends(users, currentUser, opts.input.limit - users.length, currentUser)));
      }

      if (users.length < opts.input.limit) {
        users.push(...(await getTopUserSuggestions(users, opts.input.limit - users.length, currentUser)));
      }

      return users;
    }),
  getUserBioChoices: privateProcedure.input(z.object({ page: z.number(), userId: z.string() })).query(async ({ ctx, input }) => {
    const { req, sessionId } = ctx;

    const currentUser = await authenticatedUserFromRequest(req, sessionId);
    if (!currentUser) {
      return;
    }
    const { userId, page } = input;
    if (userId != currentUser.id) {
      return { bios: [], ...pagify(0, 1, 4) };
    }

    const total = (await db.select({ value: count() }).from(OpenaiResult).where(eq(OpenaiResult.userId, currentUser.id)))[0]?.value ?? 0;
    const resp = pagify(total, page, 4);
    return {
      bios: (
        await db.query.OpenaiResult.findMany({
          limit: resp.limit,
          offset: resp.offset,
          orderBy: [desc(OpenaiResult.createdAt)],
          where: eq(OpenaiResult.userId, currentUser.id),
        })
      )
        .map((b) => {
          return {
            createdAt: b.createdAt,
            id: b.id,
            text: parseBioFromGPT(b.response as ChatCompletion),
          };
        })
        .filter((b) => !!b.text),
      ...resp,
    };
  }),
  isFollowingUser: publicProcedure.input(z.string().optional()).query(async ({ input: userId, ctx }) => {
    const { req } = ctx;

    if (!userId) {
      return false;
    }

    const currentUser = await authenticatedUserFromRequest(req);
    if (!currentUser) {
      return false;
    }

    if (currentUser.id == userId) {
      return false;
    }

    const following = await db.query.UserFollow.findFirst({
      where: and(eq(UserFollow.followedById, currentUser.id), eq(UserFollow.followingId, userId)),
    });
    return !!following;
  }),
  publicProfileInfo: publicProcedure.input(z.string().min(1)).query(async ({ ctx, input }) => {
    const { req } = ctx;

    const user = await getUserByUsernameAndRequest(input, req, {
      profileDefaults: { with: { integration: true } },
    });
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found.' });
    }

    return await userToPublicUser(user);
  }),
  setBio: privateProcedure.input(z.object({ bioId: z.string() })).mutation(async ({ ctx, input }) => {
    const { req, sessionId } = ctx;

    const user = await authenticatedUserFromRequest(req, sessionId);
    if (!user) {
      return;
    }

    const { bioId } = input;
    const result = await db.query.OpenaiResult.findFirst({
      where: and(eq(OpenaiResult.userId, user.id), eq(OpenaiResult.id, bioId)),
    });
    if (!result) {
      return;
    }

    const bio = parseBioFromGPT(result.response as ChatCompletion);
    if (!bio) {
      return;
    }

    if (bio == user.bio) {
      return;
    }

    await db.update(User).set({ bio }).where(eq(User.id, user.id));
    await db.insert(AuditLog).values({
      event: AUDIT_LOG_USER_PROFILE_BIO_CHANGED,
      ip: getIPFromReq(req),
      metadata: { bioId },
      userAgent: req.headers.get('user-agent'),
      userId: user.id,
    });
  }),
  setProfileDefault: privateProcedure
    .input(z.object({ defaultType: z.string(), integrationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { req, sessionId } = ctx;
      const { defaultType, integrationId } = input;

      const idForm = validateId(integrationId);
      if (idForm.error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: idForm.error });
      }

      const defaultForm = validateUserProfileDefaultType(defaultType);
      if (defaultForm.error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: defaultForm.error,
        });
      }

      const user = await authenticatedUserFromRequest(req, sessionId);
      if (!user) {
        return;
      }

      const integration = await db.query.Integration.findFirst({
        where: and(eq(Integration.userId, user.id), eq(Integration.id, idForm.data as string)),
      });
      if (!integration) {
        return;
      }

      await db
        .insert(ProfileDefault)
        .values({
          defaultType: defaultForm.data as string,
          integrationId: integration.id,
          userId: user.id,
        })
        .onConflictDoUpdate({
          set: {
            integrationId: integration.id,
          },
          target: [ProfileDefault.userId, ProfileDefault.defaultType],
        });
      await db.insert(AuditLog).values({
        event: AUDIT_LOG_USER_PROFILE_DEFAULT_CHANGED,
        ip: getIPFromReq(req),
        metadata: {
          dataType: defaultForm.data as string,
          provider: integration.provider,
        },
        userAgent: req.headers.get('user-agent'),
        userId: user.id,
      });
    }),
  unFollowUser: privateProcedure.input(z.string()).mutation(async ({ ctx, input: userId }) => {
    const { req, sessionId } = ctx;

    const currentUser = await authenticatedUserFromRequest(req, sessionId);
    if (!currentUser) {
      return;
    }

    const followUser = await db.query.User.findFirst({
      where: and(eq(User.isActive, true), eq(User.id, userId)),
    });
    if (!followUser) {
      return;
    }

    if (currentUser.id == followUser.id) {
      return false;
    }

    const result = await db
      .delete(UserFollow)
      .where(and(eq(UserFollow.followedById, currentUser.id), eq(UserFollow.followingId, followUser.id)))
      .returning({ createdAt: UserFollow.createdAt });
    if (result[0]?.createdAt) {
      await db.insert(AuditLog).values({
        event: AUDIT_LOG_UNFOLLOWED_USER,
        ip: getIPFromReq(req),
        metadata: { followingId: followUser.id },
        userAgent: req.headers.get('user-agent'),
        userId: currentUser.id,
      });
    }

    // remove timeline items from current user for this un-followed user
    await db
      .delete(FollowerTimelineItem)
      .where(and(eq(FollowerTimelineItem.followerId, currentUser.id), eq(FollowerTimelineItem.userId, followUser.id)));
  }),
  updateUsername: privateProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const { req, sessionId } = ctx;

    const form = validateUsername(input);
    if (form.error) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: form.error });
    }

    const user = await authenticatedUserFromRequest(req);
    if (!user) {
      return;
    }

    const oldUsername = user.username;
    if (oldUsername == form.data) {
      return;
    }

    try {
      await db
        .update(User)
        .set({ username: form.data as string })
        .where(and(eq(User.id, user.id), eq(User.sessionId, sessionId), eq(User.isActive, true)));
      await db.insert(AuditLog).values({
        event: AUDIT_LOG_USERNAME_CHANGED,
        ip: getIPFromReq(req),
        metadata: { old: oldUsername, username: form.data as string },
        userAgent: req.headers.get('user-agent'),
        userId: user.id,
      });
    } catch (e) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Username not available.',
      });
    }
  }),
});
