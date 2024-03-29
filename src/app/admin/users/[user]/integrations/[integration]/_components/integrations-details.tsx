'use client';

import Link from 'next/link';
import { LuLoader2 } from 'react-icons/lu';
import { api } from '~/trpc/client';
import { formatNumberWithSuffix } from '~/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';

export default function IntegrationsDetails({ integration, user }: { integration: string; user: string }) {
  const integrationQuery = api.admin.getUserIntegration.useQuery({
    integrationId: integration,
    userId: user,
  });

  return (
    <div className="container max-w-screen-xl space-y-8 px-4 py-8">
      {integrationQuery.isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <LuLoader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : integrationQuery.isError ? (
        <div className="text-muted-foreground">
          <p>{integrationQuery.error.message}</p>
        </div>
      ) : !integrationQuery.data.integration ? (
        <div className="text-muted-foreground">
          <p>User not found!</p>
        </div>
      ) : (
        <>
          <div>
            <div className="text-lg font-semibold">
              {integrationQuery.data.integration.provider} integration {integrationQuery.data.integration.id}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Connected at {integrationQuery.data.integration.createdAt.toISOString()}</p>
          </div>

          <hr className="h-px bg-border" />

          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <p className="text-muted-foreground">{formatNumberWithSuffix(integrationQuery.data.scrapes.length, 'scrape')}</p>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Id</TableHead>
                  <TableHead>Scraped</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrationQuery.data.scrapes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <p className="text-muted-foreground">No scrapes</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  integrationQuery.data.scrapes.map((scrape) => (
                    <TableRow key={scrape.scrapeType}>
                      <TableCell>
                        <Link
                          className="font-medium hover:underline"
                          href={`/admin/users/${integrationQuery.data.user?.id}/integrations/${integrationQuery.data.integration?.id}/scrapes/${scrape.scrapeType}`}
                        >
                          {scrape.scrapeType}
                        </Link>
                      </TableCell>
                      <TableCell>{scrape.scrapedAt.toISOString()}</TableCell>
                      <TableCell>{scrape.scrapeType}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
