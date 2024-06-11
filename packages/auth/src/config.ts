import type { NextAuthConfig, Session as NextAuthSession } from "next-auth";
import Google from "next-auth/providers/google";

import { adapter } from "./adapter";
import { env } from "./env";

export const isSecureContext = env.NODE_ENV !== "development";

export const authConfig = {
  adapter,
  trustHost: true,
  secret: env.AUTH_SECRET,
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    redirect({ url, baseUrl }) {
      // eslint-disable-next-line no-restricted-properties
      console.log({ url, baseUrl, env: process.env });
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
} satisfies NextAuthConfig;

export const validateToken = async (
  token: string,
): Promise<NextAuthSession | null> => {
  const sessionToken = token.slice("Bearer ".length);
  const session = await adapter.getSessionAndUser?.(sessionToken);
  return session
    ? {
        user: {
          ...session.user,
        },
        expires: session.session.expires.toISOString(),
      }
    : null;
};

export const invalidateSessionToken = async (token: string) => {
  await adapter.deleteSession?.(token);
};
