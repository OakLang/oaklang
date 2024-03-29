import 'dotenv/config';

import * as schema from '~/server/schema';

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { migrationClient } from '~/server/db';

const applyMigrations = async () => {
  const migrateDb = drizzle(migrationClient, { schema });
  await migrate(migrateDb, { migrationsFolder: 'drizzle' });
  await migrationClient.end();
};

await applyMigrations();
