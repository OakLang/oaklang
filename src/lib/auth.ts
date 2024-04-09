import NextAuth from 'next-auth';
import type { User as UserType } from 'next-auth';
import authConfig from './auth.config';
import { users } from './schema';
import { eq, and } from 'drizzle-orm';
import { db } from './db';
import { drizzleAdapter } from './drizzle-adapter';

declare module 'next-auth' {
  interface Session {
    user: Omit<UserType, 'id'> & { id: string };
  }
}

export const { handlers, auth } = NextAuth({
  adapter: drizzleAdapter,
  callbacks: {
    jwt: async ({ token }) => {
      if (!token.sub) {
        return null;
      }
      const refreshedUser = await db.query.users.findFirst({
        columns: {
          email: true,
          id: true,
          image: true,
          name: true,
        },
        where: and(eq(users.isActive, true), eq(users.id, token.sub)),
      });

      if (refreshedUser) {
        token.email = refreshedUser.email;
        token.name = refreshedUser.name;
        token.picture = refreshedUser.image;
      } else {
        return null;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (!token.sub) {
        return session;
      }
      session.user = {
        email: token.email ?? session.user.email,
        emailVerified: session.user.emailVerified,
        id: token.sub,
        image: token.picture ?? session.user.image,
        name: token.name ?? session.user.name,
      };
      return session;
    },
  },
  session: { strategy: 'jwt' },
  ...authConfig,
});
