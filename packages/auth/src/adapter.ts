import type {
  Adapter,
  AdapterAccount,
  AdapterAuthenticator,
  AdapterSession,
  AdapterUser,
  VerificationToken,
} from "next-auth/adapters";

import { and, eq } from "@acme/db";
import { db } from "@acme/db/client";
import {
  accountsTable,
  authenticatorsTable,
  sessionsTable,
  userSettingsTable,
  usersTable,
  verificationTokensTable,
} from "@acme/db/schema";

export const adapter: Adapter = {
  async createUser(data: AdapterUser) {
    const { email, emailVerified, image, name } = data;

    const user = await db
      .insert(usersTable)
      .values({ email, emailVerified, image, name })
      .returning()
      .then((res) => res[0]);
    if (!user) {
      throw new Error("User not found!");
    }
    await db.insert(userSettingsTable).values({ userId: user.id });
    return user;
  },
  async getUser(userId: string) {
    return db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .then((res) => res[0] ?? null);
  },
  async getUserByEmail(email: string) {
    return db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .then((res) => res[0] ?? null);
  },
  async createSession(data: {
    sessionToken: string;
    userId: string;
    expires: Date;
  }) {
    const session = await db
      .insert(sessionsTable)
      .values(data)
      .returning()
      .then((res) => res[0]);
    if (!session) {
      throw new Error("Failed to create Session!");
    }
    return session;
  },
  async getSessionAndUser(sessionToken: string) {
    return db
      .select({
        session: sessionsTable,
        user: usersTable,
      })
      .from(sessionsTable)
      .where(eq(sessionsTable.sessionToken, sessionToken))
      .innerJoin(usersTable, eq(usersTable.id, sessionsTable.userId))
      .then((res) => res[0] ?? null);
  },
  async updateUser({
    id,
    email,
    emailVerified,
    image,
    name,
  }: Partial<AdapterUser> & Pick<AdapterUser, "id">) {
    if (!id) {
      throw new Error("No user id.");
    }

    const [result] = await db
      .update(usersTable)
      .set({ email, emailVerified, image, name })
      .where(eq(usersTable.id, id))
      .returning();

    if (!result) {
      throw new Error("No user found.");
    }

    return result;
  },
  async updateSession(
    data: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">,
  ) {
    return db
      .update(sessionsTable)
      .set(data)
      .where(eq(sessionsTable.sessionToken, data.sessionToken))
      .returning()
      .then((res) => res[0]);
  },
  async linkAccount(data: AdapterAccount) {
    await db.insert(accountsTable).values(data);
  },
  async getUserByAccount(
    account: Pick<AdapterAccount, "provider" | "providerAccountId">,
  ) {
    const result = await db
      .select({
        account: accountsTable,
        user: usersTable,
      })
      .from(accountsTable)
      .innerJoin(usersTable, eq(accountsTable.userId, usersTable.id))
      .where(
        and(
          eq(accountsTable.provider, account.provider),
          eq(accountsTable.providerAccountId, account.providerAccountId),
        ),
      )
      .then((res) => res[0]);

    return result?.user ?? null;
  },
  async deleteSession(sessionToken: string) {
    await db
      .delete(sessionsTable)
      .where(eq(sessionsTable.sessionToken, sessionToken));
  },
  async createVerificationToken(data: VerificationToken) {
    return db
      .insert(verificationTokensTable)
      .values(data)
      .returning()
      .then((res) => res[0]);
  },
  async useVerificationToken(params: { identifier: string; token: string }) {
    return db
      .delete(verificationTokensTable)
      .where(
        and(
          eq(verificationTokensTable.identifier, params.identifier),
          eq(verificationTokensTable.token, params.token),
        ),
      )
      .returning()
      .then((res) => res[0] ?? null);
  },
  async deleteUser(id: string) {
    await db.delete(usersTable).where(eq(usersTable.id, id));
  },
  async unlinkAccount(
    params: Pick<AdapterAccount, "provider" | "providerAccountId">,
  ) {
    await db
      .delete(accountsTable)
      .where(
        and(
          eq(accountsTable.provider, params.provider),
          eq(accountsTable.providerAccountId, params.providerAccountId),
        ),
      );
  },
  async getAccount(providerAccountId: string, provider: string) {
    return db
      .select()
      .from(accountsTable)
      .where(
        and(
          eq(accountsTable.provider, provider),
          eq(accountsTable.providerAccountId, providerAccountId),
        ),
      )
      .then((res) => res[0] ?? null) as Promise<AdapterAccount | null>;
  },
  async createAuthenticator(data: AdapterAuthenticator) {
    const authenticator = await db
      .insert(authenticatorsTable)
      .values(data)
      .returning()
      .then((res) => res[0]);
    if (!authenticator) {
      throw new Error("Failed to create Authenticator");
    }
    return authenticator;
  },
  async getAuthenticator(credentialID: string) {
    return db
      .select()
      .from(authenticatorsTable)
      .where(eq(authenticatorsTable.credentialID, credentialID))
      .then((res) => res[0] ?? null);
  },
  async listAuthenticatorsByUserId(userId: string) {
    return db
      .select()
      .from(authenticatorsTable)
      .where(eq(authenticatorsTable.userId, userId))
      .then((res) => res);
  },
  async updateAuthenticatorCounter(credentialID: string, newCounter: number) {
    const authenticator = await db
      .update(authenticatorsTable)
      .set({ counter: newCounter })
      .where(eq(authenticatorsTable.credentialID, credentialID))
      .returning()
      .then((res) => res[0]);

    if (!authenticator) throw new Error("Authenticator not found.");

    return authenticator;
  },
};
