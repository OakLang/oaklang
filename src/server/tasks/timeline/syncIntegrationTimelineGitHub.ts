import type { GitHubEvent, GitHubRepo, TimelineTemplate } from '~/utils/types';
import { GitHubEventType, TimelineEventType, TimelineTemplateType } from '~/utils/types';
import { GlobalTimelineItem } from 'src/server/schema';
import { acquireLock, releaseLock } from 'src/server/lock';
import { and, eq, sql } from 'drizzle-orm';
import { bump, get, lvalues, rpush, set } from '~/integrations/store';
import { formatISO, parseISO } from 'date-fns';
import {
  canSyncTimelineForConnection,
  getGitHubRepo,
  getProgramLanguageForGitHubRepo,
  isGitHubRepoSignificant,
} from '~/integrations/utils/backend';
import { incrementIntegrationErrorCount, resetIntegrationErrorCount } from '~/integrations/utils/backend';

import { Duration } from 'ts-duration';
import { Integration } from 'src/server/schema';
import { db } from 'src/server/db';
import { fanOutTimelineItemToFollowers } from '~/server/tasks/timeline/fanOutTimelineItemToFollowers';
import { getLinksFromResponse } from '~/utils/helpers';
import { integrationParams } from '~/utils/backend';
import { wakaq } from '~/server/wakaq';
import { wonderfulFetch } from '~/integrations/utils';
import { removeGitHubEmojis } from '~/utils/emojis-from-github';
import { syncIntegrationMilestonesGitHub } from 'src/server/tasks/milestones/syncIntegrationMilestonesGitHub';

enum Stage {
  events = 'events',
  finish = 'finish',
  timeline = 'timeline',
}

export const syncIntegrationTimelineGitHub = wakaq.task(
  async (integrationId: unknown, jobId: unknown) => {
    const { connection, job } = await integrationParams(integrationId, jobId);
    if (!connection || !canSyncTimelineForConnection(connection)) {
      if (connection) {
        await syncIntegrationMilestonesGitHub.enqueue(connection.id);
      }
      return;
    }

    // exclusive lock
    const lockKey = `syncIntegrationTimeline-${connection.id}`;
    const lockId = await acquireLock(lockKey, Duration.minute(10));
    if (!lockId) {
      wakaq.logger?.info('Unable to acquire exclusive lock');
      return;
    }

    try {
      const stage = Stage[((await get(job, 'timelinestage')) ?? Stage.events) as keyof typeof Stage];
      wakaq.logger?.info(`stage ${stage}: ${connection.id} ${job}`);

      switch (stage) {
        case Stage.events: {
          let url = await get(job, 'events_url');
          if (!url) {
            url = `https://api.github.com/users/${connection.providerAccountUsername}/events/public?per_page=100`;
            await set(job, 'started_at', formatISO(new Date()));
            wakaq.logger?.info(`starting to sync ${connection.provider} timeline events: ${connection.id} ${job}`);
          }

          const resp = await wonderfulFetch(url, {
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `token ${connection.accessToken}`,
            },
          });
          if (resp.status !== 200) {
            wakaq.logger?.error(`Unable to get activity events feed (${resp.status}): ${url}`);
            wakaq.logger?.error(await resp.text());
            await releaseLock(lockKey, lockId);
            await incrementIntegrationErrorCount(connection);
            return;
          }
          await resetIntegrationErrorCount(connection);

          const finished = (
            await Promise.all(
              ((await resp.json()) as GitHubEvent[]).map(async (event) => {
                const created = parseISO(event.created_at);
                if (!connection.lastSyncTimelineAt || created > connection.lastSyncTimelineAt) {
                  await rpush(job, 'events', JSON.stringify(event));
                  return false;
                }
                return true;
              }),
            )
          ).find((result) => result);

          const nextUrl = getLinksFromResponse(resp).get('next');
          if (nextUrl && !finished) {
            await set(job, 'events_url', nextUrl);
            await bump(job, 'timelinestage');
            await bump(job, 'started_at');
          } else {
            await set(job, 'timelinestage', getNextStage(stage, connection, job));
          }
          await releaseLock(lockKey, lockId);
          await syncIntegrationTimelineGitHub.enqueue(connection.id, job);
          break;
        }
        case Stage.timeline: {
          const events = (await lvalues(job, 'events')).map((item) => JSON.parse(item) as GitHubEvent);
          if (!events.length) {
            wakaq.logger?.error('Missing GitHub events');
            await set(job, 'timelinestage', getNextStage(stage, connection, job));
            await bump(job, 'started_at');
            await releaseLock(lockKey, lockId);
            await syncIntegrationTimelineGitHub.enqueue(connection.id, job);
            return;
          }
          wakaq.logger?.debug(`Got ${events.length} events: ${connection.id} ${job}`);
          const values = (
            await Promise.all(
              events.map(async (event) => {
                if (!event.public) {
                  return;
                }
                const repo = await getGitHubRepo(connection, String(event.repo?.id ?? ''));
                if (!repo?.name) {
                  return;
                }
                const exists = await db.execute<{ exists: boolean }>(
                  sql`select exists(${db
                    .select({ n: sql`1` })
                    .from(GlobalTimelineItem)
                    .where(
                      and(
                        eq(GlobalTimelineItem.userId, connection.userId),
                        eq(GlobalTimelineItem.integrationId, connection.id),
                        eq(GlobalTimelineItem.uniqueId, `repo-${repo.id}`),
                      ),
                    )}) as exists`,
                );
                if (exists[0]?.exists) {
                  return;
                }
                if (!(await isGitHubRepoSignificant(connection, repo))) {
                  return;
                }
                const language = await getProgramLanguageForGitHubRepo(connection, repo);
                const posted = parseISO(event.created_at);
                if (event.type == GitHubEventType.MemberEvent) {
                  return;
                }
                return {
                  eventType: TimelineEventType.interaction,
                  integrationId: connection.id,
                  postedAt: posted,
                  programLanguageName: language?.name,
                  provider: connection.provider,
                  score: repo.stargazers_count,
                  subtitle: (repo.description
                    ? [{ text: removeGitHubEmojis(repo.description), type: TimelineTemplateType.text }]
                    : []) satisfies TimelineTemplate[],
                  title: _getTitle(event, repo),
                  uniqueId: `repo-${repo.id}`,
                  userId: connection.userId,
                };
              }),
            )
          ).filter((item) => !!item) as (typeof GlobalTimelineItem.$inferInsert)[];

          if (values.length > 0) {
            const items = await db.insert(GlobalTimelineItem).values(values).returning({ id: GlobalTimelineItem.id }).onConflictDoNothing();
            if (items.length > 0) {
              await Promise.all(items.map(async (item) => await fanOutTimelineItemToFollowers.enqueue(item.id)));
            }
          }

          await set(job, 'timelinestage', getNextStage(stage, connection, job));
          await bump(job, 'started_at');
          await releaseLock(lockKey, lockId);
          await syncIntegrationTimelineGitHub.enqueue(connection.id, job);
          break;
        }
        case Stage.finish: {
          const startedAt = parseISO((await get(job, 'started_at')) ?? '');
          await db.update(Integration).set({ lastSyncTimelineAt: startedAt }).where(eq(Integration.id, connection.id));
          wakaq.logger?.debug(`finished sync timeline ${connection.provider}: ${connection.id} ${job}`);
          await syncIntegrationMilestonesGitHub.enqueue(connection.id);
          break;
        }
      }
    } catch (e) {
      wakaq.logger?.error(e);
      await releaseLock(lockKey, lockId);
    }
  },
  { name: 'syncIntegrationTimelineGitHub' },
);

const getNextStage = (currentStage: Stage, connection: typeof Integration.$inferSelect, job: string): Stage => {
  const nextStage = _getNextStage(currentStage);
  wakaq.logger?.info(`stage transition ${currentStage} -> ${nextStage}: ${connection.id} ${job}`);
  return nextStage;
};

const _getNextStage = (currentStage: Stage): Stage => {
  switch (currentStage) {
    case Stage.events:
      return Stage.timeline;
    case Stage.timeline:
      return Stage.finish;
    case Stage.finish:
      throw new Error(`getNextStage should never be called with ${currentStage}`);
  }
};

const _getTitle = (event: GitHubEvent, repo: GitHubRepo): TimelineTemplate[] => {
  const repoLink = {
    children: [
      { avatarUrl: repo.owner.avatar_url, type: TimelineTemplateType.avatar },
      { text: `${repo.owner.login}/${repo.name}`, type: TimelineTemplateType.text },
    ],
    href: repo.html_url,

    type: TimelineTemplateType.link,
  } satisfies TimelineTemplate;
  switch (event.type) {
    case GitHubEventType.WatchEvent:
      return [{ text: 'starred ', type: TimelineTemplateType.text }, repoLink];
    case GitHubEventType.ForkEvent:
      return [{ text: 'forked ', type: TimelineTemplateType.text }, repoLink];
    case GitHubEventType.PublicEvent:
      return [{ text: 'open sourced ', type: TimelineTemplateType.text }, repoLink];
    case GitHubEventType.IssueCommentEvent: {
      const link: TimelineTemplate = {
        children: repo.name,
        href: (event.payload as { comment: { html_url: string } }).comment.html_url,

        type: TimelineTemplateType.link,
      };
      return [{ text: 'commented on ', type: TimelineTemplateType.text }, link];
    }
    case GitHubEventType.IssuesEvent: {
      const payload = event.payload as { action: string; issue: { html_url: string } };
      const link: TimelineTemplate = {
        children: repo.name,
        href: payload.issue.html_url,

        type: TimelineTemplateType.link,
      };
      return [{ text: `${payload.action} an issue on `, type: TimelineTemplateType.text }, link];
    }
    case GitHubEventType.PullRequestEvent: {
      const payload = event.payload as { action: string; pull_request: { html_url: string; merged: boolean; number: number } };
      const link: TimelineTemplate = {
        children: repo.name,
        href: payload.pull_request.html_url,

        type: TimelineTemplateType.link,
      };
      const action = payload.action == 'closed' ? (payload.pull_request.merged ? 'merged' : 'closed') : payload.action;
      return [{ text: `${action} pull request #${payload.pull_request.number} on `, type: TimelineTemplateType.text }, link];
    }
    case GitHubEventType.PullRequestReviewCommentEvent: {
      const link: TimelineTemplate = {
        children: repo.name,
        href: (event.payload as { comment: { html_url: string } }).comment.html_url,

        type: TimelineTemplateType.link,
      };
      return [{ text: 'reviewed a PR on ', type: TimelineTemplateType.text }, link];
    }
    case GitHubEventType.PullRequestReviewEvent: {
      const link: TimelineTemplate = {
        children: repo.name,
        href: (event.payload as { pull_request: { html_url: string } }).pull_request.html_url,

        type: TimelineTemplateType.link,
      };
      return [{ text: 'reviewed a PR on ', type: TimelineTemplateType.text }, link];
    }
    case GitHubEventType.PullRequestReviewThreadEvent: {
      const link: TimelineTemplate = {
        children: repo.name,
        href: (event.payload as { pull_request: { html_url: string } }).pull_request.html_url,

        type: TimelineTemplateType.link,
      };
      return [{ text: 'reviewed a PR on ', type: TimelineTemplateType.text }, link];
    }
    case GitHubEventType.SponsorshipEvent:
      return [{ text: 'sponsored ', type: TimelineTemplateType.text }, repoLink];
    case GitHubEventType.CreateEvent:
      return [{ text: 'created a branch on ', type: TimelineTemplateType.text }, repoLink];
    case GitHubEventType.DeleteEvent:
      return [{ text: 'deleted a branch on ', type: TimelineTemplateType.text }, repoLink];
    case GitHubEventType.PushEvent:
      return [{ text: 'pushed to ', type: TimelineTemplateType.text }, repoLink];
    case GitHubEventType.ReleaseEvent:
      return [{ text: 'published a release for ', type: TimelineTemplateType.text }, repoLink];
    case GitHubEventType.GollumEvent:
      return [{ text: 'updated the wiki for ', type: TimelineTemplateType.text }, repoLink];
    default:
      return [{ text: 'interacted with ', type: TimelineTemplateType.text }, repoLink];
  }
};
