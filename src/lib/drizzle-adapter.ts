import type { Adapter } from '@auth/core/adapters';
import { accounts, sessions, users, verificationTokens } from './schema';
import { db } from './db';
import { eq, and } from 'drizzle-orm';

export const drizzleAdapter: Adapter = {
  async createSession({ expires, sessionToken, userId }) {
    const [session] = await db.insert(sessions).values({ expires, sessionToken, userId }).returning();
    if (!session) {
      throw new Error('Failed to create session');
    }
    return session;
  },
  async createUser({ email, emailVerified, image, name }) {
    const [user] = await db.insert(users).values({ email, emailVerified, image, name }).returning();
    if (!user) {
      throw new Error('Failed to create user');
    }
    return user;
  },
  async createVerificationToken(token) {
    const [verificationToken] = await db.insert(verificationTokens).values(token).returning();
    return verificationToken ?? null;
  },
  async deleteSession(sessionToken) {
    const [session] = await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken)).returning();
    return session ?? null;
  },
  async deleteUser(userId) {
    await db.delete(users).where(eq(users.id, userId)).returning();
  },
  async getSessionAndUser(sessionToken) {
    const [session] = await db
      .select({
        session: sessions,
        user: users,
      })
      .from(sessions)
      .where(eq(sessions.sessionToken, sessionToken))
      .innerJoin(users, eq(users.id, sessions.userId));
    return session ?? null;
  },
  async getUser(userId) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user ?? null;
  },
  async getUserByAccount({ provider, providerAccountId }) {
    const [account] = await db
      .select({ user: users })
      .from(accounts)
      .where(and(eq(accounts.providerAccountId, providerAccountId), eq(accounts.provider, provider)))
      .innerJoin(users, eq(accounts.userId, users.id));
    if (!account) {
      return null;
    }
    return account.user;
  },
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user ?? null;
  },
  async linkAccount({ provider, providerAccountId, type, userId, access_token, expires_at, id_token, refresh_token, scope, token_type }) {
    const [account] = await db
      .insert(accounts)
      .values({
        accessToken: access_token,
        expiresAt: expires_at,
        idToken: id_token,
        provider,
        providerAccountId,
        refreshToken: refresh_token,
        scope,
        tokenType: token_type,
        type,
        userId,
      })
      .returning();
    if (!account) {
      throw new Error('Failed to link account!');
    }
    return {
      access_token: account.accessToken ?? undefined,
      authorization_details: undefined,
      expires_at: account.expiresAt ?? undefined,
      id_token: account.idToken ?? undefined,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      refresh_token: account.refreshToken ?? undefined,
      scope: account.scope ?? undefined,
      token_type: account.tokenType ?? undefined,
      type: account.type,
      userId: account.userId,
    };
  },
  async unlinkAccount({ provider, providerAccountId }) {
    const [account] = await db
      .delete(accounts)
      .where(and(eq(accounts.providerAccountId, providerAccountId), eq(accounts.provider, provider)))
      .returning();
    if (!account) {
      throw new Error('Account not found!');
    }
    return {
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      type: account.type,
      userId: account.userId,
    };
  },
  async updateSession({ expires, userId, sessionToken }) {
    const [session] = await db
      .update(sessions)
      .set({ expires, sessionToken, userId })
      .where(eq(sessions.sessionToken, sessionToken))
      .returning();
    if (!session) {
      throw new Error('Session not found!');
    }
    return session;
  },
  async updateUser({ id: userId, email, emailVerified, image, name }) {
    const [user] = await db.update(users).set({ email, emailVerified, image, name }).where(eq(users.id, userId)).returning();
    if (!user) {
      throw new Error('User not found!');
    }
    return user;
  },
  async useVerificationToken({ identifier, token }) {
    const [verificationToken] = await db
      .delete(verificationTokens)
      .where(and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.token, token)))
      .returning();
    if (!verificationToken) {
      throw new Error('Verification Token not found!');
    }
    return verificationToken;
  },
};
