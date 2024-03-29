import type { GitHubRepo, GitHubRepoScrape, GitHubUser, TimelineTemplate } from '~/utils/types';
import { TimelineEventType, TimelineTemplateType } from '~/utils/types';
import type { IntegrationScrape } from 'src/server/schema';
import { GlobalTimelineItem, IntegrationHistoricalScore, IntegrationScrapeRepo, ProgramLanguage } from 'src/server/schema';
import { acquireLock, releaseLock } from 'src/server/lock';
import { and, asc, eq } from 'drizzle-orm';
import { bump, get, hget, hlen, hset, set } from '~/integrations/store';
import { canSyncMilestonesForConnection, getScrapeForConnection } from '~/integrations/utils/backend';

import { Duration } from 'ts-duration';
import { Integration } from 'src/server/schema';
import { db } from 'src/server/db';
import { fanOutTimelineItemToFollowers } from '~/server/tasks/timeline/fanOutTimelineItemToFollowers';
import { roundToMostSignificantDigit } from '~/utils/helpers';
import { getRepoStarsAtTimeInPast, integrationParams } from '~/utils/backend';
import { wakaq } from '~/server/wakaq';
import { formatNumber } from '~/utils';
import { addDays, format, formatISO, isDate, isFirstDayOfMonth, isValid, parseISO, subDays } from 'date-fns';

enum Stage {
  contributions_by_repo = 'contributions_by_repo',
  finish = 'finish',
  follower_milestones = 'follower_milestones',
  language_milestones = 'language_milestones',
}

export const syncIntegrationMilestonesGitHub = wakaq.task(
  async (integrationId: unknown, jobId: unknown) => {
    const { connection, job } = await integrationParams(integrationId, jobId);
    if (!connection || !canSyncMilestonesForConnection(connection)) {
      return;
    }

    // exclusive lock
    const lockKey = `syncIntegrationMilestones-${connection.id}`;
    const lockId = await acquireLock(lockKey, Duration.minute(10));
    if (!lockId) {
      wakaq.logger?.info('Unable to acquire exclusive lock');
      return;
    }

    const user = connection.providerInfo as GitHubUser;

    try {
      const stage = Stage[((await get(job, 'stage')) ?? Stage.contributions_by_repo) as keyof typeof Stage];

      switch (stage) {
        case Stage.contributions_by_repo: {
          const scrape = await getScrapeForConnection(connection, 'repos');
          if (!scrape) {
            wakaq.logger?.error('Missing scraped repos');
            await releaseLock(lockKey, lockId);
            return;
          }

          await Promise.all(
            (scrape.jsonValue as { repos: GitHubRepoScrape[] }).repos.map(async (miniRepo) => {
              const cachedRepo = await db.query.IntegrationScrapeRepo.findFirst({
                where: and(eq(IntegrationScrapeRepo.provider, connection.provider), eq(IntegrationScrapeRepo.fullName, miniRepo.full_name)),
              });
              const repo = cachedRepo?.jsonValue as GitHubRepo | undefined;
              if (!repo) {
                return;
              }
              if ((repo.contributors?.length ?? 0) === 0) {
                return;
              }
              const total = (repo.contributors ?? []).reduce((p, c) => p + c.contributions, 0);
              if (total === 0) {
                return;
              }
              await Promise.all(
                (repo.contributors ?? []).map(async (contributor) => {
                  if (contributor.node_id === user.node_id) {
                    await hset(job, stage, repo.full_name, JSON.stringify(contributor.contributions / total));
                  }
                }),
              );
            }),
          );

          wakaq.logger?.info(`user contributed to ${await hlen(job, stage)} repos`);

          await set(job, 'stage', getNextStage(stage, connection, job));
          await releaseLock(lockKey, lockId);
          await syncIntegrationMilestonesGitHub.enqueue(connection.id, job);
          break;
        }
        case Stage.follower_milestones: {
          const scrape = await getScrapeForConnection(connection, 'repos', { scrapedAt: true });
          if (!scrape) {
            wakaq.logger?.error('Missing scraped repos');
            await releaseLock(lockKey, lockId);
            return;
          }

          if (user.followers < 1000) {
            await set(job, 'stage', getNextStage(stage, connection, job));
            await bump(job, Stage.contributions_by_repo);
            await releaseLock(lockKey, lockId);
            await syncIntegrationMilestonesGitHub.enqueue(connection.id, job);
            return;
          }

          await Promise.all(
            (
              await db.query.IntegrationHistoricalScore.findMany({
                orderBy: [asc(IntegrationHistoricalScore.date)],
                where: and(
                  eq(IntegrationHistoricalScore.provider, connection.provider),
                  eq(IntegrationHistoricalScore.providerAccountId, connection.providerAccountId),
                ),
              })
            ).map(async (score) => {
              if (score.score >= 1000) {
                const f = roundToMostSignificantDigit(score.score);
                const items = await db
                  .insert(GlobalTimelineItem)
                  .values({
                    eventType: TimelineEventType.milestone,
                    integrationId: connection.id,
                    postedAt: score.date,
                    provider: connection.provider,
                    score: score.score,
                    title: [
                      { text: `Gained over ${formatNumber(f)} GitHub followers 🎉`, type: TimelineTemplateType.text },
                    ] satisfies TimelineTemplate[],
                    uniqueId: `followers-${f}`,
                    userId: connection.userId,
                  })
                  .returning({ id: GlobalTimelineItem.id })
                  .onConflictDoNothing();
                if (items.length > 0) {
                  await Promise.all(items.map(async (item) => await fanOutTimelineItemToFollowers.enqueue(item.id)));
                }
              }
            }),
          );

          await set(job, 'stage', getNextStage(stage, connection, job));
          await bump(job, Stage.contributions_by_repo);
          await releaseLock(lockKey, lockId);
          await syncIntegrationMilestonesGitHub.enqueue(connection.id, job);
          break;
        }
        case Stage.language_milestones: {
          const scrape = await getScrapeForConnection(connection, 'repos');
          if (!scrape) {
            wakaq.logger?.error('Missing scraped repos');
            await releaseLock(lockKey, lockId);
            return;
          }

          // TODO: make this faster
          let at = parseISO((await get(job, stage)) ?? '');
          if (!isDate(at) || !isValid(at)) {
            at = parseISO(user.created_at);
            if (connection.lastSyncMilestonesAt && at < connection.lastSyncMilestonesAt) {
              at = subDays(connection.lastSyncMilestonesAt, 1);
            }
            await set(job, stage, format(at, 'yyyy-MM'));
          }

          if (isFirstDayOfMonth(at)) {
            wakaq.logger?.info(formatISO(at));
          }

          if (at > scrape.scrapedAt) {
            await set(job, 'stage', getNextStage(stage, connection, job));
            await releaseLock(lockKey, lockId);
            await syncIntegrationMilestonesGitHub.enqueue(connection.id, job);
            return;
          }

          const languageStars = await getLanguageStarsForUser(job, connection, scrape, at);
          await Promise.all(
            Object.entries(languageStars).map(async (lang) => {
              const name = lang[0];
              const stars = Math.floor(lang[1]);
              if (stars >= 1000) {
                const s = roundToMostSignificantDigit(stars);
                const key = `lang-${name}-${s}`;
                const items = await db
                  .insert(GlobalTimelineItem)
                  .values({
                    eventType: TimelineEventType.milestone,
                    integrationId: connection.id,
                    postedAt: at,
                    programLanguageName: name,
                    provider: connection.provider,
                    score: s,
                    title: [
                      { text: `Over ${formatNumber(s)} combined stars in ${name} repos 🎉`, type: TimelineTemplateType.text },
                    ] satisfies TimelineTemplate[],
                    uniqueId: key,
                    userId: connection.userId,
                  })
                  .returning({ id: GlobalTimelineItem.id })
                  .onConflictDoNothing();
                if (items.length > 0) {
                  await Promise.all(items.map(async (item) => await fanOutTimelineItemToFollowers.enqueue(item.id)));
                }
              }
            }),
          );

          await set(job, stage, formatISO(addDays(at, 1)));
          await bump(job, Stage.contributions_by_repo);
          await bump(job, 'stage');
          await releaseLock(lockKey, lockId);
          await syncIntegrationMilestonesGitHub.enqueue(connection.id, job);
          break;
        }
        case Stage.finish: {
          const scrape = await getScrapeForConnection(connection, 'repos', { scrapedAt: true });
          if (scrape) {
            await db.update(Integration).set({ lastSyncMilestonesAt: scrape.scrapedAt }).where(eq(Integration.id, connection.id));
          }
          wakaq.logger?.debug('finished syncing milestones');
          await releaseLock(lockKey, lockId);
          break;
        }
      }
    } catch (e) {
      wakaq.logger?.error(e);
      await releaseLock(lockKey, lockId);
    }
  },
  { name: 'syncIntegrationMilestonesGitHub' },
);

const getNextStage = (currentStage: Stage, connection: typeof Integration.$inferSelect, job: string): Stage => {
  const nextStage = _getNextStage(currentStage);
  wakaq.logger?.info(`stage transition ${currentStage} -> ${nextStage}: ${connection.id} ${job}`);
  return nextStage;
};

const _getNextStage = (currentStage: Stage): Stage => {
  switch (currentStage) {
    case Stage.contributions_by_repo:
      return Stage.follower_milestones;
    case Stage.follower_milestones:
      return Stage.language_milestones;
    case Stage.language_milestones:
      return Stage.finish;
    case Stage.finish:
      throw new Error(`getNextStage should never be called with ${currentStage}`);
  }
};

const getLanguageStarsForUser = async (
  job: string,
  connection: typeof Integration.$inferSelect,
  scrape: typeof IntegrationScrape.$inferSelect,
  at: Date,
) => {
  return (
    await Promise.all(
      (scrape.jsonValue as { repos: GitHubRepoScrape[] }).repos.map(async (miniRepo) => {
        const userPercent = JSON.parse((await hget(job, Stage.contributions_by_repo, miniRepo.full_name)) ?? '0') as number;
        if (userPercent == 0) {
          return;
        }
        const stars = await getRepoStarsAtTimeInPast(connection.provider, miniRepo.full_name, at);
        if (stars == 0) {
          return;
        }
        const cachedRepo = await db.query.IntegrationScrapeRepo.findFirst({
          where: and(eq(IntegrationScrapeRepo.provider, connection.provider), eq(IntegrationScrapeRepo.fullName, miniRepo.full_name)),
        });
        const repo = cachedRepo?.jsonValue as GitHubRepo | undefined;
        if (!repo) {
          return;
        }
        if (Object.keys(repo.languages ?? {}).length > 0) {
          const totalLines = Object.entries(repo.languages ?? {}).reduce((p, c) => p + c[1], 0);
          if (totalLines > 0) {
            return await Promise.all(
              (Object.entries(repo.languages ?? {}) as [string | undefined, number][]).map(async (lang) => {
                if (!lang[0]) {
                  return;
                }
                const l = await db.query.ProgramLanguage.findFirst({ where: eq(ProgramLanguage.name, lang[0]) });
                if (!l) {
                  return;
                }
                const starsInLang = stars * (lang[1] / totalLines);
                return {
                  name: l.name,
                  stars: starsInLang * userPercent,
                };
              }),
            );
          }
        }
      }),
    )
  )
    .flat()
    .filter((x) => !!x?.name)
    .reduce<Record<string, number>>((p, c) => {
      p[c!.name] = (p[c!.name] ?? 0) + c!.stars;
      return p;
    }, {});
};
