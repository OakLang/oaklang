import { Duration } from 'ts-duration';
import { redis } from '~/server/redis';

const expiresDefault = Duration.hour(2);

export const get = async (jobId: string, key: string): Promise<string | null> => {
  return await redis.get(`${jobId}-${key}`);
};

export const set = async (jobId: string, key: string, val: string, expires: Duration = expiresDefault): Promise<void> => {
  await redis.setex(`${jobId}-${key}`, expires.seconds, val);
};

export const del = async (jobId: string, key: string): Promise<void> => {
  await redis.del(`${jobId}-${key}`);
};

export const bump = async (jobId: string, key: string, expires: Duration = expiresDefault): Promise<void> => {
  await redis.expire(`${jobId}-${key}`, expires.seconds);
};

export const hget = async (jobId: string, key: string, subkey: string): Promise<string | null> => {
  return await redis.hget(`${jobId}-${key}`, subkey);
};

export const hset = async (jobId: string, key: string, subkey: string, val: string, expires: Duration = expiresDefault): Promise<void> => {
  await redis.hset(`${jobId}-${key}`, subkey, val);
  await redis.expire(`${jobId}-${key}`, expires.seconds);
};

export const hlen = async (jobId: string, key: string): Promise<number> => {
  return await redis.hlen(`${jobId}-${key}`);
};

export const lpop = async (jobId: string, key: string): Promise<string | null> => {
  return await redis.lpop(`${jobId}-${key}`);
};

export const rpush = async (jobId: string, key: string, ...values: string[]): Promise<void> => {
  await redis.rpush(`${jobId}-${key}`, ...values);
  await redis.expire(`${jobId}-${key}`, expiresDefault.seconds);
};

export const lvalues = async (jobId: string, key: string): Promise<string[]> => {
  return await redis.lrange(`${jobId}-${key}`, 0, -1);
};

export const llen = async (jobId: string, key: string): Promise<number> => {
  return await redis.llen(`${jobId}-${key}`);
};

export const incr = async (jobId: string, key: string, increment = 1, expires: Duration = expiresDefault): Promise<void> => {
  await redis.incrby(`${jobId}-${key}`, increment);
  await redis.expire(`${jobId}-${key}`, expires.seconds);
};
