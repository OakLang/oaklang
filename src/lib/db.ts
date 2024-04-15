import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import type { Logger } from 'drizzle-orm';
import { env } from '~/env';

const ssl = env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined;

export const migrationClient = postgres(env.DATABASE_URL, { max: 1, ssl });

const queryClient = postgres(env.DATABASE_URL, { ssl });

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

class MyLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    console.log({ params, query });
  }
}

export const db = globalForDb.db ?? drizzle(queryClient, { logger: env.LOG_SQL ? new MyLogger() : false, schema });

if (env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}
