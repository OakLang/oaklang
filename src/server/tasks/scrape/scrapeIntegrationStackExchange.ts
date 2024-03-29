import type {
  StackExchangeAnswer,
  StackExchangeComment,
  StackExchangeCommentRaw,
  StackExchangeQuestion,
  StackExchangeUser,
} from '~/utils/types';
import { acquireLock, releaseLock } from 'src/server/lock';
import { bump, get, lpop, lvalues, rpush, set } from '~/integrations/store';
import {
  canScrapeConnection,
  incrementIntegrationErrorCount,
  resetIntegrationErrorCount,
  updateScrapeForConnection,
} from '~/integrations/utils/backend';
import { rJT, wonderfulFetch } from '~/integrations/utils';

import { Duration } from 'ts-duration';
import type { Integration } from 'src/server/schema';
import { STACK_EXCHANGE_FILTER } from '~/utils/constants';
import { StackExchangePostType } from '~/utils/types';
import { createCSRFToken } from '~/utils/csrf';
import { generateProfileBio } from 'src/server/tasks/generateProfileBio';
import { integrationParams } from '~/utils/backend';
import { redis } from '~/server/redis';
import { syncIntegrationTimelineStackExchange } from 'src/server/tasks/timeline/syncIntegrationTimelineStackExchange';
import { wakaq } from '~/server/wakaq';

enum Stage {
  answers = 'answers',
  comments = 'comments',
  questions = 'questions',
  save = 'save',
}

export const scrapeIntegrationStackExchange = wakaq.task(
  async (integrationId: unknown, jobId: unknown) => {
    const { connection, job } = await integrationParams(integrationId, jobId);
    if (!connection || !canScrapeConnection(connection)) {
      return;
    }

    // exclusive lock
    const lockKey = `scrapeIntegration-${connection.id}`;
    const lockId = await acquireLock(lockKey, Duration.minute(10));
    if (!lockId) {
      wakaq.logger?.debug(`Unable to acquire exclusive lock for integration ${connection.id}`);
      return;
    }

    const requestKey = process.env.INTEGRATION_STACK_EXCHANGE_SECRET_REQUEST_KEY;
    if (!requestKey || !connection.accessToken) {
      await releaseLock(lockKey, lockId);
      return;
    }

    try {
      const stage = Stage[((await get(job, 'stage')) ?? Stage.questions) as keyof typeof Stage];

      switch (stage) {
        case Stage.questions:
        case Stage.answers:
        case Stage.comments: {
          const page = parseInt((await get(job, `${stage}.page`)) ?? '1');

          let site = await get(job, `${stage}.site`);
          if (page === 1 && !site) {
            const siteUsers = connection.providerInfo as StackExchangeUser[];
            if (siteUsers.length === 0) {
              wakaq.logger?.error('Empty site users');
              await releaseLock(lockKey, lockId);
              return;
            }
            await Promise.all(
              siteUsers.map(async (siteUser) => {
                return await rpush(job, `${stage}.siteUsers`, JSON.stringify(siteUser));
              }),
            );
            const siteUser = JSON.parse((await lpop(job, `${stage}.siteUsers`)) ?? 'null') as StackExchangeUser | null;
            if (!siteUser) {
              wakaq.logger?.error(`Missing siteUser: '${siteUser}'`);
              await releaseLock(lockKey, lockId);
              return;
            } else {
              site = siteUser.site?.api_site_parameter ?? '';
              await set(job, `${stage}.site`, site);
            }
          }

          if (!site) {
            wakaq.logger?.error(`Missing site: '${site}'`);
            await releaseLock(lockKey, lockId);
            return;
          }

          const params = new URLSearchParams({
            access_token: connection.accessToken,
            filter: STACK_EXCHANGE_FILTER,
            key: requestKey,
            order: 'asc',
            page: String(page),
            pagesize: '100',
            site: site,
            sort: 'creation',
          });
          const url = `https://api.stackexchange.com/2.3/me/${stage}?${params.toString()}`;
          const resp = await wonderfulFetch(url);
          if (resp.status >= 300) {
            wakaq.logger?.error(`Unable to get ${stage} (${resp.status}): ${await rJT(resp)}`);
            await incrementIntegrationErrorCount(connection);
            await releaseLock(lockKey, lockId);
            return;
          }
          await resetIntegrationErrorCount(connection);

          const { items, has_more } = (await resp.json()) as {
            has_more: boolean;
            items: { api_site_parameter: string }[];
          };
          wakaq.logger?.info(`Got ${items.length} ${site} ${stage}`);
          if (items.length > 0) {
            await rpush(
              job,
              stage,
              ...items.map((item) => {
                item.api_site_parameter = site!;
                return JSON.stringify(item);
              }),
            );
          }

          if (has_more && items.length > 0) {
            await set(job, `${stage}.page`, String(page + 1));
            await bump(job, 'stage');
            await bump(job, `${stage}.site`);
            await bump(job, `${stage}.siteUsers`);
          } else {
            const siteUser = JSON.parse((await lpop(job, `${stage}.siteUsers`)) ?? 'null') as StackExchangeUser | null;
            if (siteUser) {
              await bump(job, 'stage');
              await set(job, `${stage}.page`, '1');
              await set(job, `${stage}.site`, siteUser.site?.api_site_parameter ?? '');
            } else {
              await set(job, 'stage', getNextStage(stage, connection, job));
            }
          }

          await releaseLock(lockKey, lockId);
          await scrapeIntegrationStackExchange.enqueue(integrationId, job);
          break;
        }
        case Stage.save: {
          await saveStage(Stage.questions, connection, job, requestKey);
          await saveStage(Stage.answers, connection, job, requestKey);
          if (await saveStage(Stage.comments, connection, job, requestKey, true)) {
            await generateProfileBio.enqueue(connection.userId);
          }
          wakaq.logger?.info(`finished ${connection.provider}: ${connection.id} ${job}`);
          await syncIntegrationTimelineStackExchange.enqueue(connection.id, createCSRFToken(30));
          break;
        }
      }
    } catch (e) {
      wakaq.logger?.error(e);
      await releaseLock(lockKey, lockId);
    }
  },
  { name: 'scrapeIntegrationStackExchange' },
);

const getNextStage = (currentStage: Stage, connection: typeof Integration.$inferSelect, job: string): Stage => {
  const nextStage = _getNextStage(currentStage);
  wakaq.logger?.info(`stage transition ${currentStage} -> ${nextStage}: ${connection.id} ${job}`);
  return nextStage;
};

const _getNextStage = (currentStage: Stage): Stage => {
  switch (currentStage) {
    case Stage.questions:
      return Stage.answers;
    case Stage.answers:
      return Stage.comments;
    case Stage.comments:
      return Stage.save;
    case Stage.save:
      throw new Error(`getNextStage should never be called with ${currentStage}`);
  }
};

const saveStage = async (
  stage: Stage,
  connection: typeof Integration.$inferSelect,
  job: string,
  requestKey: string,
  updateScrapedAt?: boolean,
) => {
  const items = await getStageItems(stage, connection, job, requestKey);
  return await updateScrapeForConnection(connection, stage, { items }, updateScrapedAt);
};

const getStageItems = async (stage: Stage, connection: typeof Integration.$inferSelect, job: string, requestKey: string) => {
  const items = await lvalues(job, stage);
  switch (stage) {
    case Stage.questions:
      return items.map((item) => JSON.parse(item) as StackExchangeQuestion);
    case Stage.answers:
      return await Promise.all(
        items.map(async (item) => {
          const answer = JSON.parse(item) as StackExchangeAnswer;
          answer.tags = [
            ...answer.tags,
            ...(await getQuestionTags(answer.api_site_parameter, answer.question_id, connection.accessToken!, requestKey)),
          ];
          return answer;
        }),
      );
    case Stage.comments:
      return await Promise.all(
        items.map(async (item) => {
          const comment = JSON.parse(item) as StackExchangeComment & StackExchangeCommentRaw;
          comment.question_id = getQuestionId(comment);
          if (comment.post_type == StackExchangePostType.answer) {
            comment.answer_id = comment.post_id;
          }
          comment.tags = await getQuestionTags(comment.api_site_parameter, comment.question_id, connection.accessToken!, requestKey);
          return comment as StackExchangeComment;
        }),
      );
      break;
    case Stage.save:
      throw new Error(`getNextStage should never be called with ${stage}`);
  }
};

const questionIdFromUrl = /https?:\/\/[^/]+\/questions\/(?<question_id>\d+)\//;

const getQuestionId = (comment: StackExchangeCommentRaw): number => {
  if (comment.post_type == StackExchangePostType.question) {
    return comment.post_id;
  }
  const m = questionIdFromUrl.exec(comment.link);
  if (!m) {
    throw new Error(`Unable to parse question id from link: ${comment.link}`);
  }
  const question_id = parseInt(m.groups?.question_id ?? '');
  if (isNaN(question_id)) {
    throw new Error(`Missing question id in link: ${comment.link}`);
  }
  return question_id;
};

const getQuestionTags = async (api_site_parameter: string, question_id: number, accessToken: string, requestKey: string) => {
  const key = `${api_site_parameter}-question-tags-${question_id}`;
  const cache = await redis.get(key);
  const cachedTags = JSON.parse(cache ?? '[]') as string[];
  if (cachedTags.length) {
    return cachedTags;
  }

  const params = new URLSearchParams({
    access_token: accessToken,
    key: requestKey,
    site: api_site_parameter,
  });
  const url = `https://api.stackexchange.com/2.3/questions/${question_id}?${params.toString()}`;
  const resp = await wonderfulFetch(url);
  if (resp.status >= 300) {
    const err = `Unable to get StackExchange question ${question_id} (${resp.status}): ${await resp.text()}`;
    wakaq.logger?.error(err);
    throw new Error(err);
  }
  const data = (await resp.json()) as {
    items: {
      tags: string[];
    }[];
  };
  const tags = data.items[0]?.tags ?? [];
  await redis.setex(key, Duration.hour(168).seconds, JSON.stringify(tags));
  return tags;
};
