/* eslint-disable react/no-danger */
'use client';

import Link from 'next/link';
import { Card } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { api } from '~/trpc/client';
import { formatNumber } from '~/utils';

export default function IntegrationsGrid() {
  const integrationsQuery = api.admin.getIntegrationStats.useQuery();

  return (
    <div className="container max-w-screen-xl space-y-8 px-4 py-8">
      {integrationsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton className="h-28" key={i} />
          ))}
        </div>
      ) : integrationsQuery.isError ? (
        <div className="text-muted-foreground">
          <p>{integrationsQuery.error.message}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {integrationsQuery.data
            .sort((a, b) => b.total - a.total)
            .map((i) => (
              <Card asChild key={i.id}>
                <Link className="flex items-center gap-4 p-4 hover:bg-secondary/80" href={`/admin/integrations/${i.id}`}>
                  <div className="flex-1">
                    <div className="font-medium text-muted-foreground">{i.integration.name}</div>
                    <div className="text-3xl font-bold">{formatNumber(i.total)}</div>
                    {i.badgeText ? (
                      <div className="text-sm text-muted-foreground" data-tip={i.badgeTooltip}>
                        {i.badgeText}
                      </div>
                    ) : null}
                  </div>
                  {i.integration.icon ? (
                    <div className="h-8 w-8 fill-foreground" dangerouslySetInnerHTML={{ __html: i.integration.icon }} />
                  ) : null}
                </Link>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
