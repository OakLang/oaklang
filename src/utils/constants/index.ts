import { env } from '~/env';

export const APP_NAME = 'Oaklang';

export const BASE_URL = env.NEXT_PUBLIC_BASE_URL ?? (env.NODE_ENV === 'production' ? 'https://oaklang.com' : 'http://localhost:3000');
export const ADMIN_IDS = env.ADMIN_IDS?.split(',').map((s) => s.trim()) ?? [];

export const USER_AGENT_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const ALLOWED_TESTER_EMAILS = env.ALLOWED_TESTER_EMAILS?.split(',').map((email) => email.trim()) ?? [];
