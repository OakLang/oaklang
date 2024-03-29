'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useDebounce } from 'usehooks-ts';
import Pagination from '~/components/Pagination';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { api } from '~/trpc/client';
import { formatNumberWithSuffix } from '~/utils';

export default function UsersList() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce<string>(q, 300);
  const usersQuery = api.admin.searchUsers.useQuery({ page, q: debouncedQ });

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQ(e.target.value);
    setPage(1);
  };

  return (
    <div className="container max-w-screen-xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <Input className="max-w-sm flex-1" id="search" onChange={onChange} placeholder="Search users…" />
        {usersQuery.isSuccess ? (
          <p className="text-muted-foreground">{formatNumberWithSuffix(usersQuery.data.total, 'user')}</p>
        ) : (
          <Skeleton className="h-6 w-32" />
        )}
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Id</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>GitHub</TableHead>
              <TableHead>Integrations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.isLoading ? (
              [1, 2, 3, 4].map((x) => {
                return (
                  <TableRow key={x}>
                    {[1, 2, 3, 4].map((y) => (
                      <TableCell key={y}>
                        <Skeleton className="h-4 w-3/4" />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : usersQuery.isError ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="text-muted-foreground">{usersQuery.error.message}</p>
                </TableCell>
              </TableRow>
            ) : usersQuery.data.total === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="text-muted-foreground">No users</p>
                </TableCell>
              </TableRow>
            ) : (
              usersQuery.data.users.map((user) => {
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Link className="font-medium hover:underline" href={`/admin/users/${user.id}`}>
                        {user.id}
                      </Link>
                    </TableCell>
                    <TableCell>{user.username ?? ''}</TableCell>
                    <TableCell>{user.githubUser.login}</TableCell>
                    <TableCell>
                      <span title={user.integrations.map((i) => i.provider).join(', ')}>{user.integrations.length}</span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {usersQuery.isSuccess ? (
        <div>
          <Pagination
            onClickPage={(p) => {
              setPage(p);
            }}
            page={usersQuery.data.page}
            totalPages={usersQuery.data.totalPages}
          />
        </div>
      ) : null}
    </div>
  );
}
