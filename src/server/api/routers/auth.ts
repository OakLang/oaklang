import { AUDIT_LOG_USER_DELETED, CSRF_COOKIE, LOGIN_COOKIE } from '~/utils/constants';
import { AuditLog, Integration, SuggestFollowUser, User, UserFollow } from '~/server/schema';
import { createTRPCRouter, privateProcedure, publicProcedure } from '~/server/api/trpc';
import { eq, or } from 'drizzle-orm';
import { db } from '~/server/db';
import { userToPublicUser } from '~/utils/backend';
import { authenticatedUserFromRequest, sessionIdFromRequest } from '~/utils/auth';
import { getIPFromReq } from '~/utils/get-ip';
import { cookies } from 'next/headers';

export const authRouter = createTRPCRouter({
  currentUser: publicProcedure.query(async ({ ctx }) => {
    const { req } = ctx;

    const user = await authenticatedUserFromRequest(req);
    if (!user) {
      return null;
    }

    return await userToPublicUser(user);
  }),
  deleteAccount: privateProcedure.mutation(async ({ ctx }) => {
    const { req, sessionId } = ctx;

    const user = await authenticatedUserFromRequest(req);
    if (!user) {
      return null;
    }

    await db.delete(UserFollow).where(or(eq(UserFollow.followedById, user.id), eq(UserFollow.followingId, user.id)));
    await db.delete(Integration).where(eq(Integration.userId, user.id));
    await db.delete(SuggestFollowUser).where(eq(SuggestFollowUser.userId, user.id));
    await db
      .update(User)
      .set({
        githubId: null,
        githubIdBeforeDeleted: user.githubId,
        // githubResponse: {},
        isActive: false,
        username: null,
        usernameBeforeDeleted: user.username,
      })
      .where(eq(User.sessionId, sessionId));
    await db.insert(AuditLog).values({
      event: AUDIT_LOG_USER_DELETED,
      ip: getIPFromReq(req),
      userAgent: req.headers.get('user-agent'),
      userId: user.id,
    });
    cookies().delete(LOGIN_COOKIE);
    cookies().delete(CSRF_COOKIE);
  }),
  isAuthenticated: publicProcedure.query(async ({ ctx }) => {
    const { req } = ctx;
    const sessionId = await sessionIdFromRequest(req);
    return !!sessionId;
  }),
  signout: privateProcedure.mutation(() => {
    cookies().delete(LOGIN_COOKIE);
    cookies().delete(CSRF_COOKIE);
  }),
});
