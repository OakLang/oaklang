import type { DefaultSession, NextAuthConfig } from "next-auth";

import type { User, UserRole } from "@acme/db/schema";

import { env } from "./env";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole | null;
  }
}

export default {
  providers: [],
  session: { strategy: "jwt" },
  secret: env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ auth }) => {
      return !!auth?.user;
    },
    jwt: ({ token, user }) => {
      const dbUser = user as unknown as User | null | undefined;
      if (dbUser) {
        token.role = dbUser.role;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (token.role) {
        session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
