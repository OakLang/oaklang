import { DATABASE_URL, LOG_SQL, NODE_ENV } from '~/utils/constants';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import type { Logger } from 'drizzle-orm';

const ssl = NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined;

export const migrationClient = postgres(DATABASE_URL!, { max: 1, ssl });

const queryClient = postgres(DATABASE_URL!, { ssl });

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

class MyLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    console.log({ params, query });
  }
}

export const db = globalForDb.db ?? drizzle(queryClient, { logger: LOG_SQL ? new MyLogger() : false, schema });

if (NODE_ENV !== 'production') {
  globalForDb.db = db;
}
