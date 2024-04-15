import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  client: {
    NEXT_PUBLIC_BASE_URL: z.string().optional(),
    NEXT_PUBLIC_VERCEL_URL: z.string().optional(),
  },
  runtimeEnv: {
    ADMIN_IDS: process.env.ADMIN_IDS,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    LOG_SQL: process.env.LOG_SQL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
    NODE_ENV: process.env.NODE_ENV,
    OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY,
    PORT: process.env.PORT,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_USERNAME: process.env.REDIS_USERNAME,
    VERCEL_URL: process.env.VERCEL_URL,
  },
  server: {
    ADMIN_IDS: z.string().optional(),
    AUTH_GOOGLE_ID: z.string().min(1),
    AUTH_GOOGLE_SECRET: z.string().min(1),
    DATABASE_URL: z.string().url(),
    LOG_SQL: z.string().optional(),
    OPEN_AI_API_KEY: z.string().min(1),
    PORT: z.string().optional(),
    REDIS_HOST: z.string().optional(),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_PORT: z.string().optional(),
    REDIS_USERNAME: z.string().optional(),
    VERCEL_URL: z.string().optional(),
  },
  shared: {
    NODE_ENV: z.enum(['development', 'test', 'production']),
  },
});
