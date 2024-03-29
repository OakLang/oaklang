import { ADMIN_IDS, JWT_SECRET, LOGIN_COOKIE } from './constants';
import { decodeAuthJWT } from './jwt';
import { db } from '~/server/db';
import { User } from '~/server/schema';
import { and, eq } from 'drizzle-orm';
import type { DBQueryConfig } from 'drizzle-orm';
import { isCuid } from '@paralleldrive/cuid2';
import { validateUsername } from './validators';
import type { NextRequest } from 'next/server';

export const getJwtFromRequest = (req: NextRequest) => {
  const token = req.cookies.get(LOGIN_COOKIE)?.value;
  return token ?? null;
};

export const sessionIdFromRequest = async (req: NextRequest) => {
  const jwt = getJwtFromRequest(req);
  if (!jwt) {
    return null;
  }
  const secret = JWT_SECRET;
  if (!secret) {
    return null;
  }
  const sessionId = await decodeAuthJWT(jwt, secret);
  if (!sessionId) {
    return null;
  }
  return sessionId;
};

export const authenticatedUserFromRequest = async (req: NextRequest, sessionId?: string) => {
  if (!sessionId) {
    const id = await sessionIdFromRequest(req);
    if (!id) {
      return null;
    }
    sessionId = id;
  }

  const user = await db.query.User.findFirst({
    where: and(eq(User.isActive, true), eq(User.sessionId, sessionId)),
    with: {
      integrations: true,
      profileDefaults: { with: { integration: true } },
    },
  });
  if (!user) {
    req.cookies.delete(LOGIN_COOKIE);
    return null;
  }

  return user;
};

export const getUserByUsernameAndRequest = async (
  username: string,
  req?: NextRequest,
  withClause?: DBQueryConfig['with'],
): Promise<typeof User.$inferSelect | undefined> => {
  username = username.trim();
  if (username != 'me') {
    if (isCuid(username)) {
      const user = await db.query.User.findFirst({
        where: and(eq(User.id, username), eq(User.isActive, true)),
        with: withClause,
      });
      if (user) {
        return user;
      }
    }
    const form = validateUsername(username);
    if (form.error) {
      return undefined;
    }
  }
  if (username == 'me') {
    if (!req) {
      return undefined;
    }
    const sessionId = await sessionIdFromRequest(req);
    if (!sessionId) {
      return undefined;
    }
    const user = await db.query.User.findFirst({ where: and(eq(User.isActive, true), eq(User.sessionId, sessionId)), with: withClause });
    if (!user?.username) {
      return undefined;
    }
    return user;
  }
  return await db.query.User.findFirst({ where: and(eq(User.username, username), eq(User.isActive, true)), with: withClause });
};

export function isAdmin(user: typeof User.$inferSelect | null): boolean {
  if (!user) {
    return false;
  }

  return isAdminUserId(user.id);
}

export function isAdminUserId(userId: string): boolean {
  return ADMIN_IDS.includes(userId);
}
