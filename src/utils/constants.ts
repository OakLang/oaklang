export const APP_NAME = 'wonderful.dev';

export const NODE_ENV = process.env.NODE_ENV;
export const JWT_SECRET = process.env.JWT_SECRET;
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? (process.env.NODE_ENV === 'production' ? 'https://wonderful.dev' : 'http://localhost:3000');
export const ADMIN_IDS = process.env.ADMIN_IDS?.split(',').map((s) => s.trim()) ?? [];
export const LOG_SQL = process.env.LOG_SQL ?? false;

export const DATABASE_URL = process.env.DATABASE_URL;

export const REDIS_HOST = process.env.REDIS_HOST;
export const REDIS_PORT = process.env.REDIS_PORT;
export const REDIS_USERNAME = process.env.REDIS_USERNAME;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

export const OPENAI_SECRET_KEY = process.env.OPENAI_SECRET_KEY;

export const DAY = 24 * 60 * 60;
export const JWT_EXPIRES = 30 * DAY;
export const CSRF_EXPIRES = 7 * DAY;

export const LOGIN_COOKIE = 'login';
export const CSRF_COOKIE = 'csrftoken';
export const CSRF_TOKEN_HEADER = 'X-CSRF-Token';
export const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
export const CLAIM_USERNAME_COOKIE = 'claim_username';

export const USER_AGENT_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
export const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
export const GITHUB_LOGIN_APP_ID = process.env.GITHUB_LOGIN_APP_ID;
export const GITHUB_LOGIN_SECRET = process.env.GITHUB_LOGIN_SECRET;
export const GITHUB_LOGIN_REDIRECT_URI = `${BASE_URL}/login/callback`;

export const WAKAQ_TASKS_DISABLED_KEY = 'wakaq-disabled';

export const AUDIT_LOG_LOGIN = 'login';
export const AUDIT_LOG_USERNAME_CHANGED = 'username changed';
export const AUDIT_LOG_USER_CREATED = 'user created';
export const AUDIT_LOG_USER_DELETED = 'user deleted';
export const AUDIT_LOG_USER_CONNECTED_INTEGRATION = 'user connected integration';
export const AUDIT_LOG_USER_DISCONNECTED_INTEGRATION = 'user disconnected integration';
export const AUDIT_LOG_USER_PROFILE_DEFAULT_CHANGED = 'profile default changed';
export const AUDIT_LOG_USER_PROFILE_BIO_CHANGED = 'profile bio changed';
export const AUDIT_LOG_FOLLOWED_USER = 'followed user';
export const AUDIT_LOG_UNFOLLOWED_USER = 'un-followed user';

export const MIN_INTEGRATIONS_FOR_ONBOARDING = parseInt(process.env.NEXT_PUBLIC_MIN_INTEGRATIONS_FOR_ONBOARDING ?? '3');

export const NO_REFETCH_OPTS = {
  // Refetch on mount should be enabled to revalidate routes on navigate otherwise it will display stale data while navigating between routes
  // refetchOnMount: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
};

export const SIDEBAR_DISABLED_ROUTES = ['/admin', '/privacy', '/terms'];

export const STACK_EXCHANGE_FILTER = 'mZg*jyNScr8VskbdN.49.ahVYO1vQtQlswghvsYReFvO16uqQLXi2.eruQ6MSGo1XyvQW1DAWfKiaISFrD9Rzd_q(Anfk';

export const MAX_INTEGRATION_ERRORS = 10;
export const WAKATIME_CATEGORIES_FOR_SCORE = [
  'Coding',
  'Building',
  'Indexing',
  'Designing',
  'Code Reviewing',
  'Writing Docs',
  'Writing Tests',
];
