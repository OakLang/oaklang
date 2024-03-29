import type {
  StackExchangeAnswer,
  StackExchangeComment,
  StackExchangeQuestion,
  StackExchangeSite,
  StackExchangeUser,
  TimelineTemplate,
} from '~/utils/types';
import { StackExchangePostType, TimelineEventType, TimelineTemplateType } from '~/utils/types';
import { GlobalTimelineItem, ProgramLanguage } from 'src/server/schema';
import { acquireLock, releaseLock } from 'src/server/lock';
import { and, eq, sql } from 'drizzle-orm';
import { get, set } from '~/integrations/store';
import { fromUnixTime } from 'date-fns';

import { Duration } from 'ts-duration';
import { Integration } from 'src/server/schema';
import { db } from 'src/server/db';
import { fanOutTimelineItemToFollowers } from '~/server/tasks/timeline/fanOutTimelineItemToFollowers';
import { integrationParams } from '~/utils/backend';
import { wakaq } from '~/server/wakaq';
import { scrapeIntegration } from 'src/server/tasks/scrape/scrapeIntegration';
import { firstCharUppercase, truncate } from '~/utils/helpers';
import { canSyncTimelineForConnection, getScrapeForConnection } from '~/integrations/utils/backend';
import { syncIntegrationMilestonesStackExchange } from 'src/server/tasks/milestones/syncIntegrationMilestonesStackExchange';

enum Stage {
  answers = 'answers',
  comments = 'comments',
  questions = 'questions',
}

export const syncIntegrationTimelineStackExchange = wakaq.task(
  async (integrationId: unknown, jobId: unknown) => {
    const { connection, job } = await integrationParams(integrationId, jobId);
    if (!connection || !canSyncTimelineForConnection(connection)) {
      return;
    }

    // exclusive lock
    const lockKey = `syncIntegrationTimeline-${connection.id}`;
    const lockId = await acquireLock(lockKey, Duration.minute(10));
    if (!lockId) {
      wakaq.logger?.debug(`Unable to acquire exclusive lock for sync integration timeline ${connection.id}`);
      return;
    }

    // TODO: create GlobalTimelineItem for conditions:
    // * user has more than 100, 500, 1000, and multiples of 1k total reputation
    // * user has more than 100, 500, 1000, and multiples of 1k reputation associated with a program language tag

    try {
      const stage = Stage[((await get(job, 'stage')) ?? Stage.questions) as keyof typeof Stage];
      wakaq.logger?.debug(`stage ${stage}: ${connection.id} ${job}`);

      switch (stage) {
        case Stage.questions:
        case Stage.answers:
        case Stage.comments: {
          const scrape = await getScrapeForConnection(connection, stage);
          if (!scrape) {
            await scrapeIntegration.enqueue(connection.id);
            await releaseLock(lockKey, lockId);
            return;
          }

          const siteUsers = connection.providerInfo as StackExchangeUser[];

          const newItems = (
            await Promise.all(
              (scrape.jsonValue as { items: (StackExchangeQuestion | StackExchangeAnswer | StackExchangeComment)[] }).items.map(
                async (item) => {
                  if (!_isSignificant(item)) {
                    return;
                  }
                  const site = siteUsers.find((u) => u.site?.api_site_parameter === item.api_site_parameter);
                  if (!site) {
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
                          eq(GlobalTimelineItem.uniqueId, String(item.question_id)),
                        ),
                      )}) as exists`,
                  );
                  if (exists[0]?.exists) {
                    return;
                  }
                  return item;
                },
              ),
            )
          ).filter((item) => !!item) as (StackExchangeQuestion | StackExchangeAnswer | StackExchangeComment)[];

          if (newItems.length > 0) {
            const values = (await Promise.all(
              newItems.map(async (item) => {
                const site = siteUsers.find((u) => u.site?.api_site_parameter === item.api_site_parameter)?.site;
                const posted = fromUnixTime(item.creation_date);
                return {
                  eventType: TimelineEventType.interaction,
                  integrationId: connection.id,
                  postedAt: posted,
                  programLanguageName: await _getLanguage(item),
                  provider: connection.provider,
                  score: item.score,
                  subtitle: _getSubtitle(stage, item, site!),
                  title: _getTitle(stage, item, site!),
                  uniqueId: String(item.question_id),
                  userId: connection.userId,
                } satisfies typeof GlobalTimelineItem.$inferInsert;
              }),
            )) as (typeof GlobalTimelineItem.$inferInsert)[];
            const items = await db.insert(GlobalTimelineItem).values(values).returning({ id: GlobalTimelineItem.id });
            await Promise.all(items.map(async (item) => await fanOutTimelineItemToFollowers.enqueue(item.id)));
          }

          const next = getNextStage(stage, connection, job);
          if (!next) {
            await db.update(Integration).set({ lastSyncTimelineAt: scrape.scrapedAt }).where(eq(Integration.id, connection.id));
            wakaq.logger?.debug('finished sync timeline');
            await syncIntegrationMilestonesStackExchange.enqueue(connection.id);
            await releaseLock(lockKey, lockId);
            return;
          }
          await set(job, 'stage', next);

          await releaseLock(lockKey, lockId);
          await syncIntegrationTimelineStackExchange.enqueue(integrationId, job);
          break;
        }
      }
    } catch (e) {
      wakaq.logger?.error(e);
      await releaseLock(lockKey, lockId);
    }
  },
  { name: 'syncIntegrationTimelineStackExchange' },
);

const getNextStage = (currentStage: Stage, connection: typeof Integration.$inferSelect, job: string): Stage | undefined => {
  const nextStage = _getNextStage(currentStage);
  if (nextStage) {
    wakaq.logger?.debug(`stage transition ${currentStage} -> ${nextStage}: ${connection.id} ${job}`);
  }
  return nextStage;
};

const _getNextStage = (currentStage: Stage) => {
  switch (currentStage) {
    case Stage.questions:
      return Stage.answers;
    case Stage.answers:
      return Stage.comments;
    case Stage.comments:
      return undefined;
  }
};

const _getTitle = (
  stage: Stage,
  item: StackExchangeQuestion | StackExchangeAnswer | StackExchangeComment,
  site: StackExchangeSite,
): TimelineTemplate[] => {
  const type =
    stage === Stage.comments && (item as StackExchangeComment).post_type === StackExchangePostType.answer ? 'answer' : 'question';
  const link = {
    children: [
      { avatarUrl: site.icon_url, type: TimelineTemplateType.avatar },
      { text: `${site.name} ${type}`, type: TimelineTemplateType.text },
    ],
    href: item.link,
    type: TimelineTemplateType.link,
  } satisfies TimelineTemplate;
  switch (stage) {
    case Stage.questions:
      return [{ text: 'asked a ', type: TimelineTemplateType.text }, link];
    case Stage.answers:
      return [{ text: 'answered a ', type: TimelineTemplateType.text }, link];
    case Stage.comments:
      return [{ text: 'commented on a ', type: TimelineTemplateType.text }, link];
  }
};

const _getSubtitle = (
  stage: Stage,
  item: StackExchangeQuestion | StackExchangeAnswer | StackExchangeComment,
  _site: StackExchangeSite,
): TimelineTemplate[] => {
  switch (stage) {
    case Stage.questions:
      return [{ text: truncate((item as StackExchangeQuestion).title, 80), type: TimelineTemplateType.text }];
    case Stage.answers:
      return [{ text: truncate((item as StackExchangeAnswer).title, 80), type: TimelineTemplateType.text }];
    case Stage.comments: {
      const comment = item as StackExchangeComment;
      const text = commentTitle(comment);
      if (!text) {
        return [];
      }
      return [{ text: truncate(text, 80), type: TimelineTemplateType.text }];
    }
  }
};

const titleFromUrl = /https?:\/\/[^/]+\/questions\/\d+\/(?<title>[\w\d-]+)[#/]/;

const commentTitle = (comment: StackExchangeComment) => {
  const m = titleFromUrl.exec(comment.link);
  if (!m) {
    throw new Error(`Unable to parse title from link: ${comment.link}`);
  }
  return firstCharUppercase((m.groups?.title ?? '').replaceAll('-', ' '));
};

const _isSignificant = (item: StackExchangeQuestion | StackExchangeAnswer | StackExchangeComment): boolean => {
  return item.score > 50;
};

const _getLanguage = async (item: StackExchangeQuestion | StackExchangeAnswer | StackExchangeComment) => {
  try {
    return await Promise.any(
      item.tags.map(async (tag) => {
        const lang = await db.query.ProgramLanguage.findFirst({ where: eq(ProgramLanguage.name, tag) });
        if (lang) {
          return lang.name;
        }
        throw Error('');
      }),
    );
  } catch (e) {
    return;
  }
};
