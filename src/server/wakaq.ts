import { CronTask, WakaQ, WakaQueue } from 'wakaq';
import { NODE_ENV, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_USERNAME, WAKAQ_TASKS_DISABLED_KEY } from '~/utils/constants';

import { Duration } from 'ts-duration';
import { PreventTaskExecution } from 'wakaq/dist/exceptions';
import { redis } from './redis';

export const wakaq = new WakaQ({
  beforeTaskStartedCallback: async (_) => {
    if (await redis.exists(WAKAQ_TASKS_DISABLED_KEY)) {
      throw new PreventTaskExecution();
    }
  },
  concurrency: 4,
  hardTimeout: Duration.minute(3),
  host: REDIS_HOST,
  password: REDIS_PASSWORD,
  port: REDIS_PORT ? Number(REDIS_PORT) : 6379,
  queues: [new WakaQueue('default')],

  schedules: [
    // runs task (m h dom mon dow)
    new CronTask('0 0 * * *', 'syncUserInfoForAllUsers'),
    new CronTask('0 0 * * *', 'syncIntegrationTimelineForAllUsers'),
    new CronTask('0 0 * * *', 'populateSuggestFollowUsersTable'),
  ],
  //singleProcess: true, // TODO: find out why we don't see all error messages from child workers when using concurrency
  softTimeout: Duration.minute(2),
  tls: NODE_ENV == 'production' ? { host: REDIS_HOST } : undefined,
  username: REDIS_USERNAME,
  waitTimeout: Duration.second(1),
});
