'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useDebounce } from 'usehooks-ts';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import { api } from '~/trpc/client';
import { formatNumberWithSuffix } from '~/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { badgeInfoForConnection } from '~/integrations/extensions/getters';
import Link from 'next/link';

export default function ProviderIntegrationsList({ provider }: { provider: string }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce<string>(q, 300);
  const integrationsQuery = api.admin.searchIntegrations.useQuery({ page, provider, q: debouncedQ });

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQ(e.target.value);
    setPage(1);
  };

  const total = formatNumberWithSuffix(integrationsQuery.data?.total ?? 0, 'user');

  return (
    <div className="container max-w-screen-xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <Input className="max-w-sm flex-1" id="search" onChange={onChange} placeholder="Search users…" />
        {integrationsQuery.isSuccess ? (
          <p className="text-muted-foreground">{`${total} with ${provider} integrations`}</p>
        ) : (
          <Skeleton className="h-6 w-48" />
        )}
      </div>
      <div className="rounded-lg border">
        <Table className="table-xs table">
          <TableHeader>
            <TableRow>
              <TableHead>Integration</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>GitHub</TableHead>
              <TableHead>Badge text</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {integrationsQuery.isLoading ? (
              [1, 2, 3, 4].map((x) => {
                return (
                  <TableRow key={x}>
                    {[1, 2, 3, 4, 5].map((y) => (
                      <TableCell key={y}>
                        <Skeleton className="h-4 w-3/4" />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : integrationsQuery.isError ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="text-muted-foreground">{integrationsQuery.error.message}</p>
                </TableCell>
              </TableRow>
            ) : integrationsQuery.data.total === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="text-muted-foreground">No users with {provider} integrations</p>
                </TableCell>
              </TableRow>
            ) : (
              integrationsQuery.data.users.map((user) => (
                <TableRow key={user.integration?.id}>
                  <TableCell>
                    <Link className="font-medium hover:underline" href={`/admin/users/${user.id}/integrations/${user.integration?.id}`}>
                      {user.integration?.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link className="font-medium hover:underline" href={`/admin/users/${user.id}`}>
                      {user.id}
                    </Link>
                  </TableCell>
                  <TableCell>{user.username ?? ''}</TableCell>
                  <TableCell>{user.githubUser.login}</TableCell>
                  <TableCell>{user.integration ? badgeInfoForConnection(user.integration).badgeText : null}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
