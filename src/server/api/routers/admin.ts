import { BASE_URL, WAKAQ_TASKS_DISABLED_KEY } from '~/utils/constants';
/* eslint-disable max-lines */
import {
  FollowerTimelineItem,
  GlobalTimelineItem,
  Integration,
  IntegrationScrape,
  IntegrationScrapeRepo,
  OpenaiResult,
  ProgramLanguage,
  User,
  UserLoginToken,
} from '~/server/schema';
import { adminProcedure, createTRPCRouter } from '~/server/api/trpc';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { getIntegrationId, getIntegrationIdFromName, wonderfulFetch } from '~/integrations/utils';

import type { ChatCompletion } from 'openai/resources';
import { TRPCError } from '@trpc/server';
import { badgeInfoForConnection } from '~/integrations/extensions/getters';
import { count } from 'drizzle-orm';
import { db } from '~/server/db';
import { generateProfileBio } from '~/server/tasks/generateProfileBio';
import { integrations } from '~/integrations/list';
import { pagify } from '~/utils/helpers';
import { parseBioFromGPT } from '~/integrations/utils/backend';
import { populateSuggestFollowUsersTable } from '~/server/tasks/infra/populateSuggestFollowUsersTable';
import { redis } from '~/server/redis';
import { syncIntegrationTimelineForAllUsers } from '~/server/tasks/timeline/syncIntegrationTimelineForAllUsers';
import { wakaq } from '~/server/wakaq';
import { z } from 'zod';

export const adminRouter = createTRPCRouter({
  banUserForSpam: adminProcedure.input(z.string()).mutation(async ({ input }) => {
    const user = await db.query.User.findFirst({ where: eq(User.id, input) });
    if (!user) {
      return;
    }

    await db.update(User).set({ isBannedForSpam: true }).where(eq(User.id, user.id));
    await db.delete(FollowerTimelineItem).where(eq(FollowerTimelineItem.userId, user.id));
    await db.delete(GlobalTimelineItem).where(eq(GlobalTimelineItem.userId, user.id));
  }),
  deleteBio: adminProcedure.input(z.string()).mutation(async ({ input }) => {
    const result = await db.query.OpenaiResult.findFirst({ where: eq(OpenaiResult.id, input), with: { user: true } });
    if (!result) {
      return;
    }

    const bio = parseBioFromGPT(result.response as ChatCompletion);
    if (bio && result.user?.bio == bio) {
      await db.update(User).set({ bio: '' }).where(eq(User.id, result.user.id));
    }

    await db.delete(OpenaiResult).where(eq(OpenaiResult.id, result.id));
  }),
  deleteLoginTokensForUser: adminProcedure.input(z.string()).mutation(async ({ input }) => {
    await db.delete(UserLoginToken).where(eq(UserLoginToken.userId, input));
  }),
  executeBackgroundTask: adminProcedure.input(z.object({ args: z.array(z.any()), task: z.string() })).mutation(async ({ input }) => {
    const { task: taskName, args } = input;
    const task = Array.from(wakaq.tasks.values()).find((task) => task.name === taskName);
    if (!task) {
      throw new TRPCError({ code: 'NOT_FOUND', message: `Task not found: ${taskName}` });
    }
    await wakaq.enqueueAtEnd(task.name, args);
  }),
  generateBiosForAllUsers: adminProcedure.mutation(async () => {
    (
      await db.query.User.findMany({
        where: eq(User.isActive, true),
      })
    ).map(async (u) => {
      await generateProfileBio.enqueue(u.id);
    });
  }),
  generateLoginUrl: adminProcedure
    .input(z.object({ expiresAt: z.date().optional(), userId: z.string() }))
    .mutation(async ({ input: { userId, expiresAt } }) => {
      const user = await db.query.User.findFirst({
        where: and(eq(User.id, userId), eq(User.isActive, true)),
      });
      if (!user) {
        return null;
      }

      const token = (await db.insert(UserLoginToken).values({ expiresAt: expiresAt, userId: user.id }).returning())[0];
      if (!token) {
        return null;
      }

      return `${BASE_URL}/login/token?user=${user.id}&token=${token.id}`;
    }),
  getIntegrationStats: adminProcedure.query(async () => {
    return Promise.all(
      integrations.map(async (i) => {
        const c = await db.query.Integration.findFirst({
          orderBy: [desc(Integration.providerAccountScore)],
          where: eq(Integration.provider, getIntegrationIdFromName(i.name)),
        });
        return {
          badgeText: c ? badgeInfoForConnection(c).badgeText : null,
          badgeTooltip: c ? `${c.providerAccountUsername} has the highest ranking integration` : '',
          id: getIntegrationId(i),
          integration: i,
          total:
            (
              await db
                .select({ value: count() })
                .from(Integration)
                .where(eq(Integration.provider, getIntegrationIdFromName(i.name)))
            )[0]?.value ?? 0,
        };
      }),
    );
  }),
  getLoginTokens: adminProcedure.query(async () => {
    return (
      await db.query.UserLoginToken.findMany({
        orderBy: [desc(UserLoginToken.createdAt)],
        with: { user: true },
      })
    ).map((token) => {
      return {
        createdAt: token.createdAt,
        expiresAt: token.expiresAt,
        usedCount: token.usedCount,
        user: {
          id: token.user.id,
          username: token.user.username,
        },
      };
    });
  }),
  getTask: adminProcedure.input(z.string()).query(({ input }) => {
    const task = Array.from(wakaq.tasks.values()).find((task) => task.name === input);
    if (!task) {
      return undefined;
    }
    const m = task.fn.toString().match(/async\s*\(([^)]*)\)\s*=>/);
    const m2 = task.fn.toString().match(/async\s*([^=]*)\s*=>/);
    const match = m ?? m2;
    const args = match?.[1] ? match[1].split(',') : [];
    return { args, name: task.name };
  }),
  getTasksEnabledStatus: adminProcedure.query(async () => {
    return !!(await redis.exists(WAKAQ_TASKS_DISABLED_KEY));
  }),
  getUser: adminProcedure.input(z.string()).query(async ({ input }) => {
    const user = await db.query.User.findFirst({
      where: eq(User.id, input),
      with: { integrations: true },
    });
    if (!user) {
      return null;
    }

    return user;
  }),
  getUserIntegration: adminProcedure.input(z.object({ integrationId: z.string(), userId: z.string() })).query(async ({ input }) => {
    const { userId, integrationId } = input;
    const user = await db.query.User.findFirst({
      where: eq(User.id, userId),
    });
    if (!user) {
      return { integration: undefined, scrapes: [], user };
    }
    const integration = await db.query.Integration.findFirst({
      where: and(eq(Integration.userId, userId), eq(Integration.id, integrationId)),
    });
    if (!integration) {
      return { integration, scrapes: [], user };
    }

    const scrapes = await db.query.IntegrationScrape.findMany({
      columns: {
        scrapeType: true,
        scrapedAt: true,
      },
      orderBy: [desc(IntegrationScrape.scrapedAt)],
      where: eq(IntegrationScrape.integrationId, integrationId),
    });

    return { integration, scrapes, user };
  }),
  getUserIntegrationScrape: adminProcedure
    .input(z.object({ integrationId: z.string(), scrapeType: z.string(), userId: z.string() }))
    .query(async ({ input }) => {
      const { userId, integrationId, scrapeType } = input;
      return await db.query.IntegrationScrape.findFirst({
        where: and(
          eq(IntegrationScrape.userId, userId),
          eq(IntegrationScrape.integrationId, integrationId),
          eq(IntegrationScrape.scrapeType, scrapeType),
        ),
      });
    }),
  getUserIntegrationScrapeRepo: adminProcedure.input(z.object({ id: z.string(), provider: z.string() })).query(async ({ input }) => {
    const { provider, id } = input;
    const result = await db
      .select({
        createdAt: IntegrationScrapeRepo.createdAt,
        fullName: IntegrationScrapeRepo.fullName,
        provider: IntegrationScrapeRepo.provider,
        // TODO: This query throws an error `cannot delete from scalar`. If I return just raw jsonValue to `repo` then it works fine.
        repo: sql<object>`${IntegrationScrapeRepo.jsonValue}::jsonb - '{contributors,forks,stargazers,subscribers}'::text[]`.as('repo'),
      })
      .from(IntegrationScrapeRepo)
      .where(and(eq(IntegrationScrapeRepo.provider, provider), eq(IntegrationScrapeRepo.externalRepoId, id)))
      .limit(1);
    return result[0];
  }),
  recentBios: adminProcedure.input(z.object({ page: z.number() })).query(async ({ input }) => {
    const { page } = input;
    const total = (await db.select({ value: count() }).from(OpenaiResult))[0]?.value ?? 0;
    const resp = pagify(total, page);
    return {
      bios: (
        await db.query.OpenaiResult.findMany({
          limit: resp.limit,
          offset: resp.offset,
          orderBy: [desc(OpenaiResult.createdAt)],
          with: { user: true },
        })
      ).map((b) => {
        return {
          bio: parseBioFromGPT(b.response as ChatCompletion),
          result: b,
          systemPrompt: b.systemPrompt,
          user: b.user,
          userPrompt: b.userPrompt,
        };
      }),
      ...resp,
    };
  }),
  refreshSuggestedFollowUsersTable: adminProcedure.mutation(async () => {
    await populateSuggestFollowUsersTable.enqueue();
  }),
  searchIntegrations: adminProcedure.input(z.object({ page: z.number(), provider: z.string(), q: z.string() })).query(async ({ input }) => {
    const { page, q, provider } = input;
    const filter = and(
      eq(User.isActive, true),
      or(ilike(User.username, `%${q}%`), eq(Integration.id, q), eq(User.id, q)),
      eq(Integration.provider, provider),
    );
    const total =
      (
        await db
          .select({ value: count() })
          .from(User)
          .where(filter)
          .leftJoin(Integration, and(eq(User.id, Integration.userId), eq(Integration.provider, provider)))
      )[0]?.value ?? 0;
    const resp = pagify(total, page);
    return {
      users: (
        await db
          .select({ integration: Integration, user: User })
          .from(User)
          .where(filter)
          .leftJoin(Integration, and(eq(User.id, Integration.userId), eq(Integration.provider, provider)))
          .orderBy(desc(Integration.providerAccountScore), desc(Integration.createdAt))
          .limit(resp.limit)
          .offset(resp.offset)
      ).map((x) => {
        const user = x.user as typeof User.$inferSelect & { integration: typeof Integration.$inferSelect | null };
        user.integration = x.integration;
        return user;
      }),
      ...resp,
    };
  }),
  searchRepos: adminProcedure.input(z.object({ page: z.number(), q: z.string() })).query(async ({ input }) => {
    const { page, q } = input;
    const filter = ilike(IntegrationScrapeRepo.fullName, `%${q}%`);
    const total = (await db.select({ value: count() }).from(IntegrationScrapeRepo).where(filter))[0]?.value ?? 0;
    const resp = pagify(total, page);
    return {
      repos: await db.query.IntegrationScrapeRepo.findMany({
        columns: {
          createdAt: true,
          externalRepoId: true,
          fullName: true,
          provider: true,
        },
        limit: resp.limit,
        offset: resp.offset,
        orderBy: [desc(IntegrationScrapeRepo.createdAt)],
        where: filter,
      }),
      ...resp,
    };
  }),
  searchTasks: adminProcedure.input(z.object({ q: z.string() })).query(({ input }) => {
    const { q } = input;
    const tasks = Array.from(wakaq.tasks.values())
      .filter((task) => !q || task.name.toLowerCase().indexOf(q.toLowerCase()) > -1)
      .map((task) => {
        const m = task.fn.toString().match(/async\s*\(([^)]*)\)\s*=>/);
        const m2 = task.fn.toString().match(/async\s*([^=]*)\s*=>/);
        const match = m ?? m2;
        const args = match?.[1] ? match[1].split(',') : [];
        return { args, name: task.name };
      });
    return {
      tasks: tasks,
      total: tasks.length,
    };
  }),
  searchUsers: adminProcedure.input(z.object({ page: z.number(), q: z.string() })).query(async ({ input }) => {
    const { page, q } = input;
    const filter = and(eq(User.isActive, true), or(ilike(User.username, `%${q}%`), eq(User.id, q)));
    const total = (await db.select({ value: count() }).from(User).where(filter))[0]?.value ?? 0;
    const resp = pagify(total, page);
    return {
      users: await db.query.User.findMany({
        limit: resp.limit,
        offset: resp.offset,
        orderBy: [desc(User.createdAt)],
        where: filter,
        with: { integrations: true },
      }),
      ...resp,
    };
  }),
  setTasksEnabledStatus: adminProcedure.input(z.object({ isDisabled: z.boolean() })).mutation(async ({ input: { isDisabled } }) => {
    if (isDisabled) {
      await redis.set(WAKAQ_TASKS_DISABLED_KEY, '1');
    } else {
      await redis.del(WAKAQ_TASKS_DISABLED_KEY);
    }
  }),
  syncAllTimelines: adminProcedure.mutation(async () => {
    await syncIntegrationTimelineForAllUsers.enqueue();
  }),
  syncProgramLanguages: adminProcedure.mutation(async () => {
    const url = 'https://wakatime.com/api/v1/program_languages';
    const resp = await wonderfulFetch(url);
    if (resp.status !== 200) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `WakaTime API response status ${resp.status}.` });
    }
    const languages = ((await resp.json()) as { data: [{ color: string | null; name: string }] }).data;

    let updated = 0;
    for (const lang of languages) {
      const programLanguage = await db
        .insert(ProgramLanguage)
        .values({ color: lang.color, name: lang.name })
        .onConflictDoUpdate({ set: { color: lang.color }, target: ProgramLanguage.name })
        .returning();
      if (programLanguage.length > 0) {
        updated += 1;
      }
    }

    return { updated };
  }),
});
