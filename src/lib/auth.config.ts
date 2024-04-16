import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export default {
  pages: {
    signIn: '/login',
  },
  providers: [Google],
} satisfies NextAuthConfig;
