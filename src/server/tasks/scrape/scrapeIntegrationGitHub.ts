import { TimelineEventType } from '~/utils/types';
import type { GitHubGraphQLUser, GitHubRepo, GitHubRepoContributor, GitHubRepoScrape, GitHubUser } from '~/utils/types';
import { GlobalTimelineItem, Integration, IntegrationHistoricalScore, IntegrationHistoricalStarredAt } from 'src/server/schema';
import { acquireLock, releaseLock } from 'src/server/lock';
import { bump, del, get, lpop, lvalues, rpush, set } from '~/integrations/store';
import {
  canScrapeConnection,
  getScrapeForConnection,
  incrementIntegrationErrorCount,
  resetIntegrationErrorCount,
  updateScrapeForConnection,
} from '~/integrations/utils/backend';

import { Duration } from 'ts-duration';
import { IntegrationScrapeRepo } from 'src/server/schema';
import { db } from '~/server/db';
import { and, asc, eq } from 'drizzle-orm';
import { generateProfileBio } from 'src/server/tasks/generateProfileBio';
import { getLinksFromResponse } from '~/utils/helpers';
import { fetchWayBackMachineArchiveUrl, integrationParams } from '~/utils/backend';
import { addMonths, format, formatISO, isAfter, isBefore, isSameMonth, parseISO, startOfMonth, subDays } from 'date-fns';
import { responseJSON } from '~/utils/validators';
import { syncIntegrationTimeline } from 'src/server/tasks/timeline/syncIntegrationTimeline';
import { wakaq } from '~/server/wakaq';
import { wonderfulFetch } from '~/integrations/utils';
import { parseNumber } from '~/utils';
import { parse } from 'node-html-parser';

enum Stage {
  contributors = 'contributors',
  finish = 'finish',
  followers = 'followers',
  forks = 'forks',
  languages = 'languages',
  orgs = 'orgs',
  repos = 'repos',
  save_repos = 'save_repos',
  stargazers = 'stargazers',
  subscribers = 'subscribers',
}

enum CacheKey {
  earliest_score = 'earliest_score',
  repos_url = 'repos_url',
  stage = 'stage',
}

export const scrapeIntegrationGitHub = wakaq.task(
  async (integrationId: unknown, jobId: unknown) => {
    const { connection, job } = await integrationParams(integrationId, jobId);
    if (!connection || !canScrapeConnection(connection)) {
      return;
    }

    // exclusive lock
    const lockKey = `scrapeIntegration-${connection.id}`;
    const lockId = await acquireLock(lockKey, Duration.minute(10));
    if (!lockId) {
      wakaq.logger?.info('Unable to acquire exclusive lock');
      return;
    }

    try {
      const stage = Stage[((await get(job, CacheKey.stage)) ?? Stage.orgs) as keyof typeof Stage];
      wakaq.logger?.debug(stage);

      const user = connection.providerInfo as GitHubUser;

      switch (stage) {
        case Stage.orgs: {
          const url = (await get(job, 'orgs_url')) ?? 'https://api.github.com/user/orgs?per_page=100';
          const resp = await wonderfulFetch(url, {
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `token ${connection.accessToken}`,
            },
          });
          if (resp.status !== 200 && resp.status !== 204) {
            wakaq.logger?.error(`Unable to get GitHub ${stage} (${resp.status}): ${url}`);
            const text = await resp.text();
            if (text) {
              wakaq.logger?.error(text);
            }
            await incrementIntegrationErrorCount(connection);
            await releaseLock(lockKey, lockId);
            return;
          }
          await resetIntegrationErrorCount(connection);

          await Promise.all(
            ((await responseJSON(resp, [])) as unknown[]).map(async (org) => {
              return await rpush(job, Stage.orgs, JSON.stringify(org));
            }),
          );
          const nextUrl = getLinksFromResponse(resp).get('next');
          if (nextUrl) {
            await set(job, 'orgs_url', nextUrl);
            await bump(job, CacheKey.stage);
          } else {
            const orgs = (await lvalues(job, Stage.orgs)).map((item) => JSON.parse(item) as unknown);
            await updateScrapeForConnection(connection, Stage.orgs, { orgs });
            await set(job, CacheKey.stage, getNextStage(stage, connection, job));
          }
          await releaseLock(lockKey, lockId);
          await scrapeIntegrationGitHub.enqueue(integrationId, job);
          break;
        }
        case Stage.repos: {
          const url = (await get(job, CacheKey.repos_url)) ?? 'https://api.github.com/user/repos?per_page=100';
          const resp = await wonderfulFetch(url, {
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `token ${connection.accessToken}`,
            },
          });
          if (resp.status !== 200 && resp.status !== 204) {
            wakaq.logger?.error(`Unable to get GitHub ${stage} (${resp.status}): ${url}`);
            const text = await resp.text();
            if (text) {
              wakaq.logger?.error(text);
            }
            await incrementIntegrationErrorCount(connection);
            await releaseLock(lockKey, lockId);
            return;
          }
          await resetIntegrationErrorCount(connection);

          await Promise.all(
            (
              (await responseJSON(resp, [])) as {
                contributors_url: string | undefined | null;
                forks_url: string | undefined | null;
                full_name: string;
                id: number;
                languages_url: string | undefined | null;
                stargazers_count: number;
                subscribers_url: string | undefined | null;
              }[]
            ).map(async (repo) => {
              const scrapedRepo = await db.query.IntegrationScrapeRepo.findFirst({
                columns: { starsCount: true },
                where: and(
                  eq(IntegrationScrapeRepo.externalRepoId, String(repo.id)),
                  eq(IntegrationScrapeRepo.provider, connection.provider),
                ),
              });
              // skip scraping repo if stargazers count has not changed
              if (scrapedRepo && scrapedRepo.starsCount === repo.stargazers_count) {
                return await rpush(job, Stage.repos, JSON.stringify({ changed: false, repo }));
              }

              await rpush(job, Stage.stargazers, JSON.stringify({ full_name: repo.full_name, repo_id: repo.id }));
              if (repo.contributors_url) {
                await rpush(job, Stage.contributors, JSON.stringify({ repo_id: repo.id, url: `${repo.contributors_url}?per_page=100` }));
              }
              if (repo.forks_url) {
                await rpush(job, Stage.forks, JSON.stringify({ repo_id: repo.id, url: `${repo.forks_url}?per_page=100` }));
              }
              if (repo.subscribers_url) {
                await rpush(job, Stage.subscribers, JSON.stringify({ repo_id: repo.id, url: `${repo.subscribers_url}?per_page=100` }));
              }
              if (repo.languages_url) {
                await rpush(job, Stage.languages, JSON.stringify({ repo_id: repo.id, url: repo.languages_url }));
              }
              return await rpush(job, Stage.repos, JSON.stringify({ changed: true, repo }));
            }),
          );
          const nextUrl = getLinksFromResponse(resp).get('next');
          if (nextUrl) {
            await set(job, CacheKey.repos_url, nextUrl);
            await bump(job, CacheKey.stage);
          } else {
            await set(job, CacheKey.stage, getNextStage(stage, connection, job));
          }
          await releaseLock(lockKey, lockId);
          await scrapeIntegrationGitHub.enqueue(integrationId, job);
          break;
        }
        case Stage.stargazers: {
          const current = JSON.parse((await lpop(job, stage)) ?? 'null') as {
            cursor?: string;
            full_name: string;
            repo_id: number;
          } | null;
          if (!current) {
            await set(job, CacheKey.stage, getNextStage(stage, connection, job));
            await releaseLock(lockKey, lockId);
            await scrapeIntegrationGitHub.enqueue(integrationId, job);
            break;
          }
          const repoParts = current.full_name.split('/', 2);
          const owner = repoParts[0];
          const name = repoParts[1];
          const after = current.cursor ? `"${current.cursor}"` : 'null';
          const resp = await wonderfulFetch('https://api.github.com/graphql', {
            body: JSON.stringify({
              query: `query{repository(owner:"${owner}", name: "${name}") { stargazers(first: 100, after: ${after}) { pageInfo { endCursor hasNextPage } edges { starredAt node { avatarUrl bio company createdAt databaseId email followers(first:1, after:null) { totalCount } following(first:1, after:null) { totalCount } id isBountyHunter isCampusExpert isDeveloperProgramMember isEmployee isGitHubStar isHireable isSiteAdmin location login name pronouns twitterUsername updatedAt url websiteUrl } } } } }`,
            }),
            headers: {
              Authorization: `Bearer ${connection.accessToken}`,
            },
            method: 'POST',
          });
          if (resp.status !== 200) {
            wakaq.logger?.error(`${stage} error (${resp.status}): ${await resp.text()}`);
            await incrementIntegrationErrorCount(connection);
            await releaseLock(lockKey, lockId);
            return;
          }

          const data = (await responseJSON(resp, {})) as {
            data: {
              repository: {
                stargazers: {
                  edges: {
                    node: GitHubGraphQLUser;
                    starredAt: string;
                  }[];
                  pageInfo: {
                    endCursor: string;
                    hasNextPage: boolean;
                  };
                };
              };
            };
            errors?: { message: string; type: string }[];
          };

          if ((data.errors?.length ?? 0) > 0) {
            wakaq.logger?.error(`${stage} error: ${data.errors![0]?.message}`);
            await incrementIntegrationErrorCount(connection);
            await releaseLock(lockKey, lockId);
            return;
          }
          await resetIntegrationErrorCount(connection);

          await Promise.all(
            data.data.repository.stargazers.edges.map(async (edge) => {
              const key = `${stage}-${current.repo_id}`;
              await rpush(job, key, JSON.stringify(edge.node));
              await db
                .insert(IntegrationHistoricalStarredAt)
                .values({
                  externalAccountId: edge.node.id,
                  provider: connection.provider,
                  repoFullName: current.full_name,
                  starredAt: parseISO(edge.starredAt),
                })
                .onConflictDoNothing();
            }),
          );

          if (data.data.repository.stargazers.pageInfo.hasNextPage) {
            await rpush(
              job,
              stage,
              JSON.stringify({
                cursor: data.data.repository.stargazers.pageInfo.endCursor,
                full_name: current.full_name,
                repo_id: current.repo_id,
              }),
            );
          }
          await bump(job, CacheKey.stage);
          await releaseLock(lockKey, lockId);
          await scrapeIntegrationGitHub.enqueue(integrationId, job);
          break;
        }
        case Stage.contributors:
        case Stage.forks:
        case Stage.subscribers: {
          const url = JSON.parse((await lpop(job, stage)) ?? 'null') as { repo_id: number; url: string } | null;
          if (!url) {
            await set(job, CacheKey.stage, getNextStage(stage, connection, job));
            await releaseLock(lockKey, lockId);
            await scrapeIntegrationGitHub.enqueue(integrationId, job);
            break;
          }
          const resp = await wonderfulFetch(url.url, {
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `token ${connection.accessToken}`,
            },
          });
          if (resp.status !== 200 && resp.status !== 204) {
            wakaq.logger?.error(`Unable to get GitHub ${stage} (${resp.status}): ${url.url}`);
            const text = await resp.text();
            if (text) {
              wakaq.logger?.error(text);
            }
            await incrementIntegrationErrorCount(connection);
            await releaseLock(lockKey, lockId);
            return;
          }
          await resetIntegrationErrorCount(connection);

          await Promise.all(
            ((await responseJSON(resp, [])) as unknown[]).map(async (item) => {
              const key = `${stage}-${url.repo_id}`;
              return await rpush(job, key, JSON.stringify(item));
            }),
          );
          const nextUrl = getLinksFromResponse(resp).get('next');
          if (nextUrl) {
            await rpush(job, stage, JSON.stringify({ repo_id: url.repo_id, url: nextUrl }));
          }
          await bump(job, CacheKey.stage);
          await releaseLock(lockKey, lockId);
          await scrapeIntegrationGitHub.enqueue(integrationId, job);
          break;
        }
        case Stage.languages: {
          const url = JSON.parse((await lpop(job, stage)) ?? 'null') as { repo_id: number; url: string } | null;
          if (!url) {
            await set(job, CacheKey.stage, getNextStage(stage, connection, job));
            await releaseLock(lockKey, lockId);
            await scrapeIntegrationGitHub.enqueue(integrationId, job);
            break;
          }
          const resp = await wonderfulFetch(url.url, {
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `token ${connection.accessToken}`,
            },
          });
          if (resp.status !== 200 && resp.status !== 204) {
            wakaq.logger?.error(`Unable to get GitHub ${stage} (${resp.status}): ${url.url}`);
            const text = await resp.text();
            if (text) {
              wakaq.logger?.error(text);
            }
            await incrementIntegrationErrorCount(connection);
            await releaseLock(lockKey, lockId);
            return;
          }
          await resetIntegrationErrorCount(connection);

          const key = `${stage}-${url.repo_id}`;
          await set(job, key, JSON.stringify(await responseJSON(resp, {})));
          await bump(job, CacheKey.stage);
          await releaseLock(lockKey, lockId);
          await scrapeIntegrationGitHub.enqueue(integrationId, job);
          break;
        }
        case Stage.save_repos: {
          const repos = await Promise.all(
            (await lvalues(job, Stage.repos)).map(async (item) => {
              const { repo, changed } = JSON.parse(item) as { changed: boolean; repo: GitHubRepo };
              if (!changed) {
                return {
                  full_name: repo.full_name,
                  id: repo.id,
                };
              }
              repo.contributors = (await lvalues(job, `${Stage.contributors}-${repo.id}`)).map(
                (item) => JSON.parse(item) as GitHubRepoContributor,
              );
              repo.forks = (await lvalues(job, `${Stage.forks}-${repo.id}`)).map((item) => JSON.parse(item) as unknown);
              repo.stargazers = (await lvalues(job, `${Stage.stargazers}-${repo.id}`)).map((item) => {
                const u = JSON.parse(item) as GitHubGraphQLUser;
                return {
                  avatar_url: u.avatarUrl,
                  bio: u.bio,
                  blog: u.websiteUrl,
                  company: u.company,
                  created_at: u.createdAt,
                  email: u.email ? u.email : null,
                  followers: u.followers.totalCount,
                  following: u.following.totalCount,
                  hireable: u.isHireable,
                  html_url: `https://github.com/${u.login}`,
                  id: u.databaseId,
                  location: u.location,
                  login: u.login,
                  name: u.name,
                  node_id: u.id,
                  site_admin: u.isSiteAdmin,
                  twitter_username: u.twitterUsername,
                  updated_at: u.updatedAt,
                  url: u.url,
                } satisfies GitHubUser;
              });
              repo.subscribers = (await lvalues(job, `${Stage.subscribers}-${repo.id}`)).map((item) => JSON.parse(item) as GitHubUser);
              repo.languages = JSON.parse((await get(job, `${Stage.languages}-${repo.id}`)) ?? '{}') as Record<string, number>;
              await db
                .insert(IntegrationScrapeRepo)
                .values({
                  createdByUserId: connection.userId,
                  externalRepoId: String(repo.id),
                  fullName: repo.full_name,
                  jsonValue: repo,
                  provider: connection.provider,
                  starsCount: repo.stargazers_count,
                })
                .onConflictDoUpdate({
                  set: {
                    fullName: repo.full_name,
                    jsonValue: repo,
                    starsCount: repo.stargazers_count,
                  },
                  target: [IntegrationScrapeRepo.provider, IntegrationScrapeRepo.externalRepoId],
                });
              return {
                full_name: repo.full_name,
                id: repo.id,
              };
            }),
          );

          // cleanup timeline events from deleted repos
          const scrape = await getScrapeForConnection(connection, 'repos', { jsonValue: true });
          if (scrape) {
            await Promise.all(
              (scrape.jsonValue as { repos: GitHubRepoScrape[] }).repos.map(async (repo) => {
                if (repos.includes(repo)) {
                  return;
                }
                await db
                  .delete(GlobalTimelineItem)
                  .where(
                    and(
                      eq(GlobalTimelineItem.userId, connection.userId),
                      eq(GlobalTimelineItem.provider, connection.provider),
                      eq(GlobalTimelineItem.integrationId, connection.id),
                      eq(GlobalTimelineItem.eventType, TimelineEventType.interaction),
                      eq(GlobalTimelineItem.uniqueId, `repo-${repo.id}`),
                    ),
                  );
              }),
            );
          }

          if (await updateScrapeForConnection(connection, Stage.repos, { repos })) {
            await generateProfileBio.enqueue(connection.userId);
          }
          await set(job, CacheKey.stage, getNextStage(stage, connection, job));
          await releaseLock(lockKey, lockId);
          await scrapeIntegrationGitHub.enqueue(integrationId, job);
          break;
        }
        case Stage.followers: {
          // only backfill the first time we scrape this GitHub integration
          if (connection.lastScrapedAt) {
            await set(job, CacheKey.stage, getNextStage(stage, connection, job));
            await releaseLock(lockKey, lockId);
            await scrapeIntegrationGitHub.enqueue(integrationId, job);
            return;
          }

          // only backfill for GitHub users with 10+ followers
          if (user.followers < 10) {
            await set(job, CacheKey.stage, getNextStage(stage, connection, job));
            await releaseLock(lockKey, lockId);
            await scrapeIntegrationGitHub.enqueue(integrationId, job);
            return;
          }

          let endDate;
          const earliest = await get(job, CacheKey.earliest_score);
          if (earliest) {
            endDate = parseISO(earliest);
          } else {
            const earliestScore = await db.query.IntegrationHistoricalScore.findFirst({
              orderBy: [asc(IntegrationHistoricalScore.date)],
              where: and(
                eq(IntegrationHistoricalScore.provider, connection.provider),
                eq(IntegrationHistoricalScore.providerAccountId, connection.providerAccountId),
              ),
            });
            endDate = earliestScore?.date ?? subDays(new Date(), 2);
            await set(job, CacheKey.earliest_score, formatISO(endDate));
          }

          const current = await get(job, stage);
          let date;
          if (current) {
            date = parseISO(current);
          } else {
            date = subDays(parseISO(user.created_at), 2);
          }
          wakaq.logger?.info(`backfilling followers for ${format(date, 'yyyy-MM-dd')} with end date ${format(endDate, 'yyyy-MM-dd')}`);

          if (isAfter(date, endDate) || isSameMonth(date, endDate)) {
            wakaq.logger?.info(`${format(date, 'yyyy-MM-dd')} > ${format(endDate, 'yyyy-MM-dd')}`);
            await set(job, CacheKey.stage, getNextStage(stage, connection, job));
            await releaseLock(lockKey, lockId);
            await scrapeIntegrationGitHub.enqueue(integrationId, job);
            return;
          }

          const archive = await fetchWayBackMachineArchiveUrl(`https://github.com/${user.login}`, date);
          if (!archive) {
            wakaq.logger?.info('No archive');
            await set(job, stage, formatISO(startOfMonth(addMonths(date, 1))));
            await bump(job, CacheKey.earliest_score);
            await bump(job, CacheKey.stage);
            await releaseLock(lockKey, lockId);
            await scrapeIntegrationGitHub.enqueue(integrationId, job);
            return;
          }

          if (isAfter(archive.timestamp, endDate)) {
            wakaq.logger?.info(`${format(archive.timestamp, 'yyyy-MM-dd')} > ${format(endDate, 'yyyy-MM-dd')}`);
            await set(job, CacheKey.stage, getNextStage(stage, connection, job));
            await releaseLock(lockKey, lockId);
            await scrapeIntegrationGitHub.enqueue(integrationId, job);
            return;
          }

          // waybackmachine returns archives around (before or after) date, but we only want ones after
          // date because that guarantees we aren't getting the same archive as the last iteration
          if (isBefore(archive.timestamp, date)) {
            await set(job, stage, formatISO(startOfMonth(addMonths(date, 1))));
            await bump(job, CacheKey.earliest_score);
            await bump(job, CacheKey.stage);
            await releaseLock(lockKey, lockId);
            await scrapeIntegrationGitHub.enqueue(integrationId, job);
            return;
          }

          const resp = await wonderfulFetch(archive.url, { timeout: 30 });
          if (resp.status !== 200) {
            wakaq.logger?.error(`Waybackmachine fetch error ${archive.url} (${resp.status}): ${await resp.text()}`);
            await releaseLock(lockKey, lockId);
            return;
          }

          let followers = await getFollowersFromProfileResponse(resp);
          if (followers === undefined) {
            wakaq.logger?.error(`Unknown GitHub profile DOM: ${archive.url}`);
            await releaseLock(lockKey, lockId);
            return;
          }

          // GitHub profile HTML inaccurately rounds followers up when decimal is 9 (4.9k -> 5k)
          if (followers > user.followers) {
            followers = user.followers;
          }

          await db
            .insert(IntegrationHistoricalScore)
            .values({
              date: archive.timestamp,
              provider: connection.provider,
              providerAccountId: connection.providerAccountId,
              score: Math.floor(followers),
            })
            .onConflictDoNothing();

          await set(job, stage, formatISO(startOfMonth(addMonths(archive.timestamp, 1))));
          await bump(job, CacheKey.earliest_score);
          await bump(job, CacheKey.stage);
          await releaseLock(lockKey, lockId);
          await scrapeIntegrationGitHub.enqueue(integrationId, job);
          break;
        }
        case Stage.finish: {
          await db
            .update(Integration)
            .set({
              lastScrapedAt: new Date(),
            })
            .where(eq(Integration.id, connection.id));
          await del(job, CacheKey.stage);
          await releaseLock(lockKey, lockId);
          await syncIntegrationTimeline.enqueue(connection.id);
          break;
        }
      }
    } catch (e) {
      wakaq.logger?.error(e);
      await releaseLock(lockKey, lockId);
    }
  },
  { name: 'scrapeIntegrationGitHub' },
);

const getNextStage = (currentStage: Stage, connection: typeof Integration.$inferSelect, job: string): Stage => {
  const nextStage = _getNextStage(currentStage);
  wakaq.logger?.info(`stage transition ${currentStage} -> ${nextStage}: ${connection.id} ${job}`);
  return nextStage;
};

const _getNextStage = (currentStage: Stage): Stage => {
  switch (currentStage) {
    case Stage.orgs:
      return Stage.repos;
    case Stage.repos:
      return Stage.stargazers;
    case Stage.stargazers:
      return Stage.contributors;
    case Stage.contributors:
      return Stage.forks;
    case Stage.forks:
      return Stage.subscribers;
    case Stage.subscribers:
      return Stage.languages;
    case Stage.languages:
      return Stage.save_repos;
    case Stage.save_repos:
      return Stage.followers;
    case Stage.followers:
      return Stage.finish;
    case Stage.finish:
      throw new Error(`getNextStage should never be called with ${currentStage}`);
  }
};

export const getFollowersFromProfileResponse = async (resp: Response) => {
  try {
    const root = parse(await resp.text());

    // view-source:http://web.archive.org/web/20130811084358/https://github.com/alanhamlett
    const stats = root.querySelector('ul.stats > li > a');
    if (stats?.innerText.toLowerCase().includes('followers')) {
      const f = stats.querySelector('strong');
      if (f) {
        return parseNumber(f.innerText);
      }
    }

    // view-source:http://web.archive.org/web/20150818061247/https://github.com/alanhamlett
    const vcardStat = root.querySelector('a.vcard-stat');
    if (vcardStat?.querySelector('span.text-muted')?.innerText.toLowerCase().trim() === 'followers') {
      const f = vcardStat.querySelector('.vcard-stat-count');
      if (f) {
        return parseNumber(f.innerText);
      }
    }

    // view-source:http://web.archive.org/web/20161110204827/https://github.com/mojombo
    const profileNavCounter = root
      .querySelector('.user-profile-nav')
      ?.querySelectorAll('a')
      .find((href) => href.innerText.toLowerCase().includes('followers'))
      ?.querySelector('span.counter');
    if (profileNavCounter) {
      return parseNumber(profileNavCounter.innerText);
    }

    // view-source:http://web.archive.org/web/20190301160247/https://github.com/alanhamlett
    const profileNavCounterUpper = root
      .querySelector('.user-profile-nav')
      ?.querySelectorAll('a')
      .find((href) => href.innerText.toLowerCase().includes('followers'))
      ?.querySelector('span.Counter');
    if (profileNavCounterUpper) {
      return parseNumber(profileNavCounterUpper.innerText);
    }

    // view-source:http://web.archive.org/web/20240101181514/https://github.com/alanhamlett
    const people = root.querySelector('a > svg.octicon-people');
    if (people?.parentNode.tagName.toLowerCase() === 'a' && people.parentNode.innerText.toLowerCase().includes('followers')) {
      const peopleVal = people.parentNode.querySelector('span.text-bold');
      if (peopleVal) {
        return parseNumber(peopleVal.innerText);
      }
    }
  } catch (e) {
    console.log(e);
    return;
  }
};
