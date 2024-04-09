import type { Adapter } from '@auth/core/adapters';
import { Account, Session, User, VerificationToken } from './schema';
import { db } from './db';
import { eq, and } from 'drizzle-orm';

export const drizzleAdapter: Adapter = {
  async createSession(data) {
    const session = await db
      .insert(Session)
      .values(data)
      .returning()
      .then((res) => res[0]);
    if (!session) {
      throw new Error('Failed to create session');
    }
    return session;
  },
  async createUser(data) {
    const user = await db
      .insert(User)
      .values(data)
      .returning()
      .then((res) => res[0]);
    if (!user) {
      throw new Error('Failed to create user');
    }
    return user;
  },
  async createVerificationToken(token) {
    return await db
      .insert(VerificationToken)
      .values(token)
      .returning()
      .then((res) => res[0]);
  },
  async deleteSession(sessionToken) {
    const session = await db
      .delete(Session)
      .where(eq(Session.sessionToken, sessionToken))
      .returning()
      .then((res) => res[0] ?? null);

    return session;
  },
  async deleteUser(id) {
    await db
      .delete(User)
      .where(eq(User.id, id))
      .returning()
      .then((res) => res[0] ?? null);
  },
  async getSessionAndUser(data) {
    return await db
      .select({
        session: Session,
        user: User,
      })
      .from(Session)
      .where(eq(Session.sessionToken, data))
      .innerJoin(User, eq(User.id, Session.userId))
      .then((res) => res[0] ?? null);
  },
  async getUser(data) {
    return await db
      .select()
      .from(User)
      .where(eq(User.id, data))
      .then((res) => res[0] ?? null);
  },
  async getUserByAccount(account) {
    const dbAccount =
      (await db
        .select()
        .from(Account)
        .where(and(eq(Account.providerAccountId, account.providerAccountId), eq(Account.provider, account.provider)))
        .leftJoin(User, eq(Account.userId, User.id))
        .then((res) => res[0])) ?? null;

    return dbAccount?.user ?? null;
  },
  async getUserByEmail(data) {
    return await db
      .select()
      .from(User)
      .where(eq(User.email, data))
      .then((res) => res[0] ?? null);
  },
  async linkAccount(rawAccount) {
    const account = await db
      .insert(Account)
      .values(rawAccount)
      .returning()
      .then((res) => res[0]);

    if (!account) {
      throw new Error('Failed to link account!');
    }

    return {
      access_token: account.access_token ?? undefined,
      authorization_details: undefined,
      expires_at: account.expires_at ?? undefined,
      id_token: account.id_token ?? undefined,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      refresh_token: account.refresh_token ?? undefined,
      scope: account.scope ?? undefined,
      token_type: account.token_type ?? undefined,
      type: account.type,
      userId: account.userId,
    };
  },
  async unlinkAccount(account) {
    const deletedAccount = await db
      .delete(Account)
      .where(and(eq(Account.providerAccountId, account.providerAccountId), eq(Account.provider, account.provider)))
      .returning()
      .then((res) => res[0]);

    if (!deletedAccount) {
      throw new Error('Account not found!');
    }

    return {
      provider: deletedAccount.provider,
      providerAccountId: deletedAccount.providerAccountId,
      type: deletedAccount.type,
      userId: deletedAccount.userId,
    };
  },
  async updateSession(data) {
    return await db
      .update(Session)
      .set(data)
      .where(eq(Session.sessionToken, data.sessionToken))
      .returning()
      .then((res) => res[0]);
  },
  async updateUser(data) {
    if (!data.id) {
      throw new Error('No user id.');
    }

    const user = await db
      .update(User)
      .set(data)
      .where(eq(User.id, data.id))
      .returning()
      .then((res) => res[0]);
    if (!user) {
      throw new Error('User not found!');
    }
    return user;
  },
  async useVerificationToken(token) {
    try {
      return await db
        .delete(VerificationToken)
        .where(and(eq(VerificationToken.identifier, token.identifier), eq(VerificationToken.token, token.token)))
        .returning()
        .then((res) => res[0] ?? null);
    } catch (err) {
      throw new Error('No verification token found.');
    }
  },
};
