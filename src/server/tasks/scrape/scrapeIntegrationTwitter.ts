import { canScrapeConnection } from '~/integrations/utils/backend';
import { integrationParams } from '~/utils/backend';
import { wakaq } from '~/server/wakaq';

export const scrapeIntegrationTwitter = wakaq.task(
  async (integrationId: unknown, jobId: unknown) => {
    const { connection } = await integrationParams(integrationId, jobId);
    if (!connection || !canScrapeConnection(connection)) {
      return;
    }

    // Twitter API does not allow access to a users's followers anymore
    // https://developer.twitter.com/en/portal/products
    /*
    const stage = Stage[((await get(job, 'stage')) ?? Stage.followers) as keyof typeof Stage];

    switch (stage) {
      case Stage.followers:
      case Stage.following: {
        wakaq.logger?.info(`starting at stage ${stage}: ${connection.id} ${job}`);
        const fields = [
          'created_at',
          'description',
          'id',
          'location',
          'name',
          'profile_image_url',
          'protected',
          'public_metrics',
          'username',
          'verified',
          'verified_type',
        ].join(',');
        const url =
          (await get(job, `${stage}_url`)) ??
          `https://api.twitter.com/2/users/${connection.providerAccountId}/${stage}?max_results=1000&user.fields=${fields}`;
        const resp = await wonderfulFetch(url, {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
        });
        if (resp.status !== 200) {
          wakaq.logger?.error(`Unable to get Twitter ${stage}: ${resp.status}`);
          wakaq.logger?.error(await resp.text());
          return;
        }

        const json = (await resp.json()) as { data: unknown[]; meta: { next_token: string } };

        await Promise.all(
          json.data.map(async (user) => {
            return await rpush(job, stage, JSON.stringify(user));
          }),
        );
        const token = json.meta.next_token;
        if (token) {
          const nextUrl = `https://api.twitter.com/2/users/${connection.providerAccountId}/${stage}?max_results=1000&user.fields=${fields}&pagination_token=${token}`;
          await set(job, `${stage}_url`, nextUrl);
          await set(job, 'stage', stage); // refresh expire time
          await releaseLock(lockKey, lockId);
          await scrapeIntegrationTwitter.enqueue(integrationId, job);
        } else {
          const users = (await lvalues(job, stage)).map((item) => JSON.parse(item) as unknown);
          await db.insert(IntegrationScrape).values({
            integrationId: connection.id,
            jobId: job,
            jsonValue: { users },
            lookupKey: stage,
            provider: connection.provider,
            userId: connection.userId,
          });
          const nextStage = getNextStage(stage, connection, job);
          if (nextStage) {
            await set(job, 'stage', nextStage);
            await releaseLock(lockKey, lockId);
            await scrapeIntegrationTwitter.enqueue(integrationId, job);
          } else {
            wakaq.logger?.info(`finished ${connection.provider}: ${connection.id} ${job}`);
          }
        }
        break;
      }
    }
    */
  },
  { name: 'scrapeIntegrationTwitter' },
);
