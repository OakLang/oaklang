import { Badge, IntegrationScrapeRepo, ProgramLanguage } from '~/server/schema';
import type { GitHubRepo, GitHubRepoScrape } from '~/utils/types';
import { acquireLock, releaseLock } from 'src/server/lock';
import { and, eq } from 'drizzle-orm';

import { Duration } from 'ts-duration';
import { db } from '~/server/db';
import { getScrapeForConnection } from '~/integrations/utils/backend';
import { integrationParams } from '~/utils/backend';
import { wakaq } from '~/server/wakaq';

export const syncBadgesGitHub = wakaq.task(
  async (integrationId: unknown, jobId: unknown) => {
    const { connection, job } = await integrationParams(integrationId, jobId);
    if (!connection || !job) {
      wakaq.logger?.error(`Missing connection or jobid: [${integrationId as string}, ${jobId as string}]`);
      return;
    }

    // exclusive lock
    const lockKey = `syncBadges-${connection.id}`;
    const lockId = await acquireLock(lockKey, Duration.minute(10));
    if (!lockId) {
      return;
    }

    try {
      const scrape = await getScrapeForConnection(connection, 'repos');
      if (!scrape) {
        await releaseLock(lockKey, lockId);
        return;
      }
      const languageStars = (
        await Promise.all(
          (scrape.jsonValue as { repos: GitHubRepoScrape[] }).repos.map(async (miniRepo) => {
            const cachedRepo = await db.query.IntegrationScrapeRepo.findFirst({
              where: and(eq(IntegrationScrapeRepo.provider, connection.provider), eq(IntegrationScrapeRepo.fullName, miniRepo.full_name)),
            });
            const repo = cachedRepo?.jsonValue as GitHubRepo | undefined;
            if (!repo) {
              return;
            }
            if (repo.stargazers_count > 0 && Object.keys(repo.languages ?? {}).length > 0) {
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
                    return {
                      name: l.name,
                      stars: Math.floor(repo.stargazers_count * (lang[1] / totalLines)),
                    };
                  }),
                );
              }
            }
            return;
          }),
        )
      )
        .flat()
        .filter((x) => !!x?.name)
        .reduce<Record<string, number>>((p, c) => {
          p[c!.name] = (p[c!.name] ?? 0) + c!.stars;
          return p;
        }, {});

      await Promise.all(
        Object.entries(languageStars).map(async (lang) => {
          const name = lang[0];
          const stars = lang[1];
          if (stars > 1000) {
            const s = Math.pow(10, stars.toString().length);
            await db
              .insert(Badge)
              .values({
                explanation: [],
                programLanguageName: name,
                provider: connection.provider,
                score: s,
                userId: connection.userId,
              })
              .onConflictDoNothing();
          }
        }),
      );
    } catch (e) {
      await releaseLock(lockKey, lockId);
      throw e;
    }
    await releaseLock(lockKey, lockId);
  },
  { name: 'syncBadgesGitHub' },
);
