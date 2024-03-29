import { acquireLock, releaseLock } from 'src/server/lock';
import {
  canScrapeConnection,
  getScrapeForConnection,
  incrementIntegrationErrorCount,
  resetIntegrationErrorCount,
  updateScrapeForConnection,
} from '~/integrations/utils/backend';
import { Duration } from 'ts-duration';
import { integrationParams } from '~/utils/backend';
import { wakaq } from '~/server/wakaq';
import { wonderfulFetch } from '~/integrations/utils';
import type { ProductHuntPost, ProductHuntUser } from '~/utils/types';
import { subHours } from 'date-fns';

export const scrapeIntegrationProductHunt = wakaq.task(
  async (integrationId: unknown, jobId: unknown) => {
    const { connection } = await integrationParams(integrationId, jobId);
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

    const providerInfo = connection.providerInfo as ProductHuntUser;
    const scrape = await getScrapeForConnection(connection, 'posts');

    let posts: ProductHuntPost[] = [];
    if (scrape && scrape.scrapedAt > subHours(new Date(), 12)) {
      posts = (scrape.jsonValue as { posts: ProductHuntPost[] }).posts;
    } else {
      try {
        const resp = await wonderfulFetch('https://api.producthunt.com/v2/api/graphql', {
          body: JSON.stringify({
            query: `
          query {
            viewer {
              user {
                madePosts {
                  nodes {
                    id
                    userId
                    createdAt
                    name
                    slug
                    website
                    url
                    votesCount
                    description
                    makers {
                      id
                    }
                  }
                }
              }
            }
          }
          `,
          }),
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
          method: 'POST',
        });

        if (resp.status !== 200) {
          wakaq.logger?.error(`Unable to get ProductHunt user madePosts (${resp.status}): ${await resp.text()}`);
          const text = await resp.text();
          if (text) {
            wakaq.logger?.error(text);
          }
          await incrementIntegrationErrorCount(connection);
          await releaseLock(lockKey, lockId);
          return;
        }

        await resetIntegrationErrorCount(connection);
        const data = (await resp.json()) as {
          data: {
            viewer: {
              user: {
                madePosts: {
                  nodes: {
                    createdAt: string;
                    description: string;
                    id: string;
                    makers: {
                      id: string;
                    }[];
                    name: string;
                    slug: string;
                    url: string;
                    userId: string;
                    votesCount: number;
                    website: string;
                  }[];
                };
              };
            };
          };
        };
        // Only add posts where they are listed as maker
        posts = data.data.viewer.user.madePosts.nodes.filter((post) => post.userId === providerInfo.user.id);
      } catch (e) {
        wakaq.logger?.error(e);
        await releaseLock(lockKey, lockId);
        return;
      }

      await updateScrapeForConnection(connection, 'posts', { posts }, true);
    }

    wakaq.logger?.debug('Finished syncing ProductHunt posts');
    await releaseLock(lockKey, lockId);
  },
  { name: 'scrapeIntegrationProductHunt' },
);
