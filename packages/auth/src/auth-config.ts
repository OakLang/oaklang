import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

import { env } from "./env";

export default {
  providers: [Google],
  session: { strategy: "jwt" },
  secret: env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ auth }) => {
      return !!auth?.user;
    },
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
      };
    },
  },
} satisfies NextAuthConfig;
