import type { Adapter } from '@auth/core/adapters';
import { accountsTable, sessionsTable, usersTable, verificationTokensTable } from './schema';
import { db } from './db';
import { eq, and } from 'drizzle-orm';

export const drizzleAdapter: Adapter = {
  async createSession({ expires, sessionToken, userId }) {
    const [session] = await db.insert(sessionsTable).values({ expires, sessionToken, userId }).returning();
    if (!session) {
      throw new Error('Failed to create session');
    }
    return session;
  },
  async createUser({ email, emailVerified, image, name }) {
    const [user] = await db.insert(usersTable).values({ email, emailVerified, image, name }).returning();
    if (!user) {
      throw new Error('Failed to create user');
    }
    return user;
  },
  async createVerificationToken(token) {
    const [verificationToken] = await db.insert(verificationTokensTable).values(token).returning();
    return verificationToken ?? null;
  },
  async deleteSession(sessionToken) {
    const [session] = await db.delete(sessionsTable).where(eq(sessionsTable.sessionToken, sessionToken)).returning();
    return session ?? null;
  },
  async deleteUser(userId) {
    await db.delete(usersTable).where(eq(usersTable.id, userId)).returning();
  },
  async getSessionAndUser(sessionToken) {
    const [session] = await db
      .select({
        session: sessionsTable,
        user: usersTable,
      })
      .from(sessionsTable)
      .where(eq(sessionsTable.sessionToken, sessionToken))
      .innerJoin(usersTable, eq(usersTable.id, sessionsTable.userId));
    return session ?? null;
  },
  async getUser(userId) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    return user ?? null;
  },
  async getUserByAccount({ provider, providerAccountId }) {
    const [account] = await db
      .select({ user: usersTable })
      .from(accountsTable)
      .where(and(eq(accountsTable.providerAccountId, providerAccountId), eq(accountsTable.provider, provider)))
      .innerJoin(usersTable, eq(accountsTable.userId, usersTable.id));
    if (!account) {
      return null;
    }
    return account.user;
  },
  async getUserByEmail(email) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    return user ?? null;
  },
  async linkAccount({ provider, providerAccountId, type, userId, access_token, expires_at, id_token, refresh_token, scope, token_type }) {
    const [account] = await db
      .insert(accountsTable)
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
      .delete(accountsTable)
      .where(and(eq(accountsTable.providerAccountId, providerAccountId), eq(accountsTable.provider, provider)))
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
      .update(sessionsTable)
      .set({ expires, sessionToken, userId })
      .where(eq(sessionsTable.sessionToken, sessionToken))
      .returning();
    if (!session) {
      throw new Error('Session not found!');
    }
    return session;
  },
  async updateUser({ id: userId, email, emailVerified, image, name }) {
    const [user] = await db.update(usersTable).set({ email, emailVerified, image, name }).where(eq(usersTable.id, userId)).returning();
    if (!user) {
      throw new Error('User not found!');
    }
    return user;
  },
  async useVerificationToken({ identifier, token }) {
    const [verificationToken] = await db
      .delete(verificationTokensTable)
      .where(and(eq(verificationTokensTable.identifier, identifier), eq(verificationTokensTable.token, token)))
      .returning();
    if (!verificationToken) {
      throw new Error('Verification Token not found!');
    }
    return verificationToken;
  },
};
