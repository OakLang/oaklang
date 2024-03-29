'use client';

import { LuLoader2 } from 'react-icons/lu';
import { api } from '~/trpc/client';

export default function ScrapeDetails({ integration, scrape, user }: { integration: string; scrape: string; user: string }) {
  const scrapeQuery = api.admin.getUserIntegrationScrape.useQuery({
    integrationId: integration,
    scrapeType: scrape,
    userId: user,
  });

  return (
    <div className="container max-w-screen-xl space-y-8 px-4 py-8">
      {scrapeQuery.isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <LuLoader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : scrapeQuery.isError ? (
        <div className="text-muted-foreground">
          <p>{scrapeQuery.error.message}</p>
        </div>
      ) : !scrapeQuery.data ? (
        <div className="text-muted-foreground">
          <p>User not found!</p>
        </div>
      ) : (
        <>
          <div>
            <div className="text-lg font-semibold">
              {scrapeQuery.data.provider} scrape {scrapeQuery.data.scrapeType}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Scraped at {scrapeQuery.data.scrapedAt.toISOString()}</p>
          </div>

          <hr className="h-px bg-border" />

          <div>
            <pre className="overflow-x-auto rounded-md bg-secondary p-4">{JSON.stringify(scrapeQuery.data.jsonValue, null, 2)}</pre>
          </div>
        </>
      )}
    </div>
  );
}
