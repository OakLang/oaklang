import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import type { Logger } from 'drizzle-orm';
import { env } from './env';

export * from 'drizzle-orm';
export { alias } from 'drizzle-orm/pg-core';


export const ssl = env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined;

const client = postgres(env.DATABASE_URL, { ssl });

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

class MyLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    console.log({ params, query });
  }
}

export const db = globalForDb.db ?? drizzle(client, { logger: env.LOG_SQL ? new MyLogger() : false, schema });

if (env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}
