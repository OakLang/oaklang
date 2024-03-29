import {
  AUDIT_LOG_LOGIN,
  AUDIT_LOG_USERNAME_CHANGED,
  AUDIT_LOG_USER_CREATED,
  JWT_EXPIRES,
  JWT_SECRET,
  LOGIN_COOKIE,
  NODE_ENV,
} from './constants';
import { decodeAuthJWT, encodeAuthJWT } from './jwt';
import { db } from '~/server/db';
import { AuditLog, User } from '~/server/schema';
import { and, eq } from 'drizzle-orm';
import type { DBQueryConfig } from 'drizzle-orm';
import { isCuid } from '@paralleldrive/cuid2';
import { validateUsername } from './validators';
import { cookies, headers } from 'next/headers';

export const getJwt = () => {
  const jwt = cookies().get(LOGIN_COOKIE);
  return jwt?.value ?? null;
};

export const getSessionId = async (): Promise<string | null> => {
  const jwt = getJwt();
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

export const getUser = async (sessionId?: string) => {
  if (!sessionId) {
    const id = await getSessionId();
    if (!id) {
      return null;
    }
    sessionId = id;
  }

  const user = await db.query.User.findFirst({
    where: and(eq(User.isActive, true), eq(User.sessionId, sessionId)),
  });

  if (!user) {
    cookies().delete(LOGIN_COOKIE);
    return null;
  }

  return user;
};

export const getUserByUsername = async (username: string, withClause?: DBQueryConfig['with']): Promise<typeof User.$inferSelect | null> => {
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
      return null;
    }
  }
  if (username == 'me') {
    const sessionId = await getSessionId();
    if (!sessionId) {
      return null;
    }
    const user = await db.query.User.findFirst({ where: and(eq(User.isActive, true), eq(User.sessionId, sessionId)), with: withClause });
    if (!user?.username) {
      return null;
    }
    return user;
  }
  const user = await db.query.User.findFirst({ where: and(eq(User.username, username), eq(User.isActive, true)), with: withClause });
  return user ?? null;
};

export const loginUser = async (user: typeof User.$inferSelect, username: string | null, isNewUser: boolean) => {
  const secret = JWT_SECRET;
  if (!secret) {
    return;
  }

  const ip = headers().get('X-Forwarded-For') ?? '';
  const userAgent = headers().get('user-agent');

  if (!isNewUser && username && user.username !== username) {
    await db.update(User).set({ username: username }).where(eq(User.id, user.id));
    await db.insert(AuditLog).values({
      event: AUDIT_LOG_USERNAME_CHANGED,
      ip,
      metadata: { username: username },
      userAgent,
      userId: user.id,
    });
  }
  await db.insert(AuditLog).values({
    event: isNewUser ? AUDIT_LOG_USER_CREATED : AUDIT_LOG_LOGIN,
    ip,
    metadata: { username: username },
    userAgent,
    userId: user.id,
  });
  const payload = await encodeAuthJWT(user.sessionId, secret);
  cookies().set(LOGIN_COOKIE, payload, {
    httpOnly: true,
    maxAge: JWT_EXPIRES,
    sameSite: 'lax',
    secure: NODE_ENV === 'production',
  });
};
