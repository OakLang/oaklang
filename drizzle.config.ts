import type { Config } from 'drizzle-kit';
import { DATABASE_URL } from '~/utils/constants';

export default {
  dbCredentials: {
    connectionString: DATABASE_URL!,
  },
  driver: 'pg',
  out: 'drizzle',
  schema: 'src/server/schema.ts',
} satisfies Config;
