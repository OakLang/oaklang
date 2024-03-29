'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useDebounce } from 'usehooks-ts';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import { api } from '~/trpc/client';
import { formatNumberWithSuffix } from '~/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import Link from 'next/link';
import Pagination from '~/components/Pagination';

export default function ReposList() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce<string>(q, 300);
  const reposQuery = api.admin.searchRepos.useQuery({ page, q: debouncedQ });

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQ(e.target.value);
    setPage(1);
  };

  return (
    <div className="container max-w-screen-xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <Input className="max-w-sm flex-1" id="search" onChange={onChange} placeholder="Search repos…" />
        {reposQuery.isSuccess ? (
          <p className="text-muted-foreground">{formatNumberWithSuffix(reposQuery.data.total, 'repo')}</p>
        ) : (
          <Skeleton className="h-6 w-32" />
        )}
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reposQuery.isLoading ? (
              [1, 2, 3, 4].map((x) => {
                return (
                  <TableRow key={x}>
                    {[1, 2, 3].map((y) => (
                      <TableCell key={y}>
                        <Skeleton className="h-4 w-3/4" />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : reposQuery.isError ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="text-muted-foreground">{reposQuery.error.message}</p>
                </TableCell>
              </TableRow>
            ) : reposQuery.data.total === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="text-muted-foreground">No repos</p>
                </TableCell>
              </TableRow>
            ) : (
              reposQuery.data.repos.map((repo) => (
                <TableRow key={`${repo.provider}-${repo.externalRepoId}`}>
                  <TableCell>
                    <Link className="font-medium hover:underline" href={`/admin/repos/${repo.provider}/${repo.externalRepoId}`}>
                      {repo.fullName}
                    </Link>
                  </TableCell>
                  <TableCell>{repo.provider}</TableCell>
                  <TableCell>{repo.createdAt.toISOString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {reposQuery.isSuccess ? (
        <div>
          <Pagination
            onClickPage={(p) => {
              setPage(p);
            }}
            page={reposQuery.data.page}
            totalPages={reposQuery.data.totalPages}
          />
        </div>
      ) : null}
    </div>
  );
}
