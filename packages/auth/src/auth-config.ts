import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

import { APP_NAME, NO_REPLY_EMAIL } from "@acme/core/constants";
import { resend } from "@acme/email";
import VerificationRequest from "@acme/email/emails/verification-request";

import { env } from "./env";

export default {
  providers: [
    Resend({
      apiKey: env.RESEND_API_KEY,
      sendVerificationRequest: async ({ url, identifier }) => {
        const { error } = await resend.emails.send({
          from: `Sign in to ${APP_NAME} <${NO_REPLY_EMAIL}>`,
          to: identifier,
          subject: `Sign in to ${APP_NAME}`,
          react: VerificationRequest({
            title: `Sign in to ${APP_NAME}`,
            url,
            appName: APP_NAME,
          }),
        });
        if (error) {
          throw new Error(error.message);
        }
      },
    }),
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
  ],
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
