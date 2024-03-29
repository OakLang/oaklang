import { NODE_ENV, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME } from '~/utils/constants';

import { Redis } from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis({
    commandTimeout: 15000,
    connectTimeout: 15000,
    db: 0,
    host: REDIS_HOST,
    keyPrefix: 'wd',
    lazyConnect: true,
    noDelay: true,
    password: REDIS_PASSWORD,
    port: REDIS_PORT ? Number(REDIS_PORT) : undefined,
    tls: NODE_ENV == 'production' ? { host: REDIS_HOST } : undefined,
    username: REDIS_USERNAME,
  });

if (NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}
