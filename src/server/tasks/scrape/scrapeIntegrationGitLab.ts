import { acquireLock, releaseLock } from 'src/server/lock';
import {
  canScrapeConnection,
  incrementIntegrationErrorCount,
  resetIntegrationErrorCount,
  updateScrapeForConnection,
} from '~/integrations/utils/backend';
import { get, lpop, lvalues, rpush, set } from '~/integrations/store';

import { Duration } from 'ts-duration';
import type { Integration } from 'src/server/schema';
import { generateProfileBio } from 'src/server/tasks/generateProfileBio';
import { getLinksFromResponse } from '~/utils/helpers';
import { integrationParams } from '~/utils/backend';
import { wakaq } from '~/server/wakaq';
import { wonderfulFetch } from '~/integrations/utils';

enum Stage {
  contributors_url = 'contributors_url',
  groups = 'groups',
  projects = 'projects',
  save_projects = 'save_projects',
  starrers_url = 'starrers_url',
  user = 'user',
}

export const scrapeIntegrationGitLab = wakaq.task(
  async (integrationId: unknown, jobId: unknown) => {
    const { connection, job } = await integrationParams(integrationId, jobId);
    if (!connection || !canScrapeConnection(connection)) {
      return;
    }

    // exclusive lock
    const lockKey = `scrapeIntegration-${connection.id}`;
    const lockId = await acquireLock(lockKey, Duration.minute(10));
    if (!lockId) {
      wakaq.logger?.info(`Unable to acquire exclusive lock for integration ${connection.id}`);
      return;
    }

    const stage = Stage[((await get(job, 'stage')) ?? Stage.user) as keyof typeof Stage];

    switch (stage) {
      case Stage.user: {
        wakaq.logger?.info(`starting at stage ${stage}: ${connection.id} ${job}`);
        const resp = await wonderfulFetch('https://gitlab.com/api/v4/user', {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
        });
        if (resp.status !== 200) {
          wakaq.logger?.error(`Unable to get user (${resp.status}): ${await resp.text()}`);
          await incrementIntegrationErrorCount(connection);
          await releaseLock(lockKey, lockId);
          return;
        }
        await resetIntegrationErrorCount(connection);

        const user = (await resp.json()) as unknown;
        await updateScrapeForConnection(connection, Stage.user, { user }, true);

        await set(job, 'stage', getNextStage(stage, connection, job));
        await releaseLock(lockKey, lockId);
        await scrapeIntegrationGitLab.enqueue(integrationId, job);
        break;
      }
      case Stage.groups: {
        await set(job, 'stage', getNextStage(stage, connection, job));
        await releaseLock(lockKey, lockId);
        await scrapeIntegrationGitLab.enqueue(integrationId, job);
        break;
        /*
        const url =
          (await get(job, 'groups_url')) ??
          'https://gitlab.com/api/v4/groups?top_level_only=true&min_access_level=10&order_by=id&pagination=keyset&per_page=100';
        const resp = await wonderfulFetch(url, {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
        });
        if (resp.status !== 200) {
          wakaq.logger?.error(`Unable to get GitLab groups: ${resp.status}`);
          wakaq.logger?.error(await resp.text());
          await releaseLock(lockKey, lockId);
          return;
        }
        await Promise.all(
          ((await resp.json()) as unknown[]).map(async (group) => {
            return await rpush(job, Stage.groups, JSON.stringify(group));
          }),
        );
        const nextUrl = getLinksFromResponse(resp).get('next');
        if (nextUrl) {
          await set(job, 'groups_url', nextUrl);
          await set(job, 'stage', stage); // refresh expire time
        } else {
          const groups = (await lvalues(job, Stage.groups)).map((item) => JSON.parse(item) as unknown);
          await db.insert(IntegrationScrape).values({
            integrationId: connection.id,
            jobId: job,
            jsonValue: { groups },
            lookupKey: Stage.groups,
            provider: connection.provider,
            userId: connection.userId,
          });
          await set(job, 'stage', getNextStage(stage, connection, job));
        }
        await releaseLock(lockKey, lockId);
        await scrapeIntegrationGitLab.enqueue(integrationId, job);
        break;
        */
      }
      case Stage.projects: {
        const url =
          (await get(job, 'projects_url')) ??
          'https://gitlab.com/api/v4/projects?min_access_level=20&per_page=100&order_by=id&pagination=keyset';
        const resp = await wonderfulFetch(url, {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
        });
        if (resp.status !== 200) {
          wakaq.logger?.error(`Unable to get GitLab projects: ${resp.status}`);
          wakaq.logger?.error(await resp.text());
          await releaseLock(lockKey, lockId);
          return;
        }
        await Promise.all(
          ((await resp.json()) as { id: number }[]).map(async (project) => {
            await rpush(
              job,
              Stage.contributors_url,
              JSON.stringify({
                project_id: project.id,
                url: `https://gitlab.com/api/v4/projects/${project.id}/repository/contributors?per_page=100&order_by=email&pagination=keyset`,
              }),
            );
            await rpush(
              job,
              Stage.starrers_url,
              JSON.stringify({
                project_id: project.id,
                url: `https://gitlab.com/api/v4/projects/${project.id}/starrers?per_page=100&order_by=id&pagination=keyset`,
              }),
            );
            return await rpush(job, Stage.projects, JSON.stringify(project));
          }),
        );
        const nextUrl = getLinksFromResponse(resp).get('next');
        if (nextUrl) {
          await set(job, 'projects_url', nextUrl);
          await set(job, 'stage', stage); // refresh expire time
        } else {
          await set(job, 'stage', getNextStage(stage, connection, job));
        }
        await releaseLock(lockKey, lockId);
        await scrapeIntegrationGitLab.enqueue(integrationId, job);
        break;
      }
      case Stage.contributors_url:
      case Stage.starrers_url: {
        const url = JSON.parse((await lpop(job, stage)) ?? 'null') as { project_id: number; url: string } | null;
        if (!url) {
          await set(job, 'stage', getNextStage(stage, connection, job));
          await releaseLock(lockKey, lockId);
          await scrapeIntegrationGitLab.enqueue(integrationId, job);
          break;
        }
        const resp = await wonderfulFetch(url.url, {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
        });
        if (resp.status !== 200) {
          wakaq.logger?.error(`Unable to get GitLab ${stage}: ${resp.status}`);
          wakaq.logger?.error(await resp.text());
          await releaseLock(lockKey, lockId);
          return;
        }
        await Promise.all(
          ((await resp.json()) as unknown[]).map(async (item) => {
            const key = `${stage}-${url.project_id}`;
            return await rpush(job, key, JSON.stringify(item));
          }),
        );
        const nextUrl = getLinksFromResponse(resp).get('next');
        if (nextUrl) {
          await rpush(job, stage, JSON.stringify({ project_id: url.project_id, url: nextUrl }));
        }
        await set(job, 'stage', stage); // refresh expire time
        await releaseLock(lockKey, lockId);
        await scrapeIntegrationGitLab.enqueue(integrationId, job);
        break;
      }
      case Stage.save_projects: {
        const projects = await Promise.all(
          (await lvalues(job, Stage.projects)).map(async (item) => {
            const project = JSON.parse(item) as {
              contributors: unknown[];
              id: number;
              starrers: unknown[];
            };
            project.contributors = (await lvalues(job, `${Stage.contributors_url}-${project.id}`)).map(
              (item) => JSON.parse(item) as unknown,
            );
            project.starrers = (await lvalues(job, `${Stage.starrers_url}-${project.id}`)).map((item) => JSON.parse(item) as unknown);
            return project;
          }),
        );
        if (await updateScrapeForConnection(connection, Stage.projects, { projects })) {
          await generateProfileBio.enqueue(connection.userId);
        }
        wakaq.logger?.info(`finished ${connection.provider}: ${connection.id} ${job}`);
        break;
      }
    }
  },
  { name: 'scrapeIntegrationGitLab' },
);

const getNextStage = (currentStage: Stage, connection: typeof Integration.$inferSelect, job: string): Stage => {
  const nextStage = _getNextStage(currentStage);
  wakaq.logger?.info(`stage transition ${currentStage} -> ${nextStage}: ${connection.id} ${job}`);
  return nextStage;
};

const _getNextStage = (currentStage: Stage): Stage => {
  switch (currentStage) {
    case Stage.user:
      return Stage.groups;
    case Stage.groups:
      return Stage.projects;
    case Stage.projects:
      return Stage.contributors_url;
    case Stage.contributors_url:
      return Stage.starrers_url;
    case Stage.starrers_url:
      return Stage.save_projects;
    case Stage.save_projects:
      throw new Error(`getNextStage should never be called with ${currentStage}`);
  }
};
