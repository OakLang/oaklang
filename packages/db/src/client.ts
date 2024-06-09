import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";

import { env } from "./env";
import * as schema from "./schema";

export type DB = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  db: DB | undefined;
};

export const db = globalForDb.db ?? drizzle(sql, { schema });

if (env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
