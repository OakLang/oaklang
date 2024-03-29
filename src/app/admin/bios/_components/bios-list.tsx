'use client';

import { useState } from 'react';
import { Skeleton } from '~/components/ui/skeleton';
import { api } from '~/trpc/client';
import { formatNumberWithSuffix } from '~/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Button } from '~/components/ui/button';
import Link from 'next/link';
import { LuTrash2 } from 'react-icons/lu';
import Pagination from '~/components/Pagination';
import { DialogContent, DialogHeader, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from '~/components/ui/dialog';

export default function BiosList() {
  const [page, setPage] = useState(1);
  const biosQuery = api.admin.recentBios.useQuery({ page });
  const deleteBio = api.admin.deleteBio.useMutation();

  const onClickDelete = async (id: string) => {
    await deleteBio.mutateAsync(id);
    await biosQuery.refetch();
  };

  return (
    <div className="container max-w-screen-xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1" />
        {biosQuery.isSuccess ? (
          <p className="text-muted-foreground">{formatNumberWithSuffix(biosQuery.data.total, 'chatgpt bio generation')}</p>
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
              <TableHead>Bio</TableHead>
              <TableHead>Length</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {biosQuery.isLoading ? (
              [1, 2, 3, 4].map((x) => {
                return (
                  <TableRow key={x}>
                    {[1, 2, 3, 4, 5, 6].map((y) => (
                      <TableCell key={y}>
                        <Skeleton className="h-4 w-3/4" />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : biosQuery.isError ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="text-muted-foreground">{biosQuery.error.message}</p>
                </TableCell>
              </TableRow>
            ) : biosQuery.data.total === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="text-muted-foreground">No users</p>
                </TableCell>
              </TableRow>
            ) : (
              biosQuery.data.bios.map((b) => (
                <TableRow key={b.result.id}>
                  <TableCell>
                    <Link className="font-medium hover:underline" href={`/admin/users/${b.user?.id}`}>
                      {b.user?.id}
                    </Link>
                  </TableCell>
                  <TableCell>{b.user?.username ?? ''}</TableCell>
                  <TableCell>{b.user?.githubUser.login}</TableCell>
                  <TableCell>
                    <DialogRoot>
                      <DialogTrigger>{b.bio}</DialogTrigger>
                      <DialogPortal>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>System Prompt</DialogTitle>
                          </DialogHeader>
                          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-secondary p-4">{b.systemPrompt}</pre>
                          <DialogHeader>
                            <DialogTitle>User Prompt</DialogTitle>
                          </DialogHeader>
                          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-secondary p-4">{b.userPrompt}</pre>
                        </DialogContent>
                      </DialogPortal>
                    </DialogRoot>
                  </TableCell>
                  <TableCell>{b.bio?.length ?? 0}</TableCell>
                  <TableCell className="py-0">
                    <Button onClick={() => onClickDelete(b.result.id)} variant="outline">
                      <LuTrash2 className="-ml-1 mr-2 h-5 w-5" />
                      Delete Link
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {biosQuery.isSuccess ? (
        <Pagination
          onClickPage={(p) => {
            setPage(p);
          }}
          page={biosQuery.data.page}
          totalPages={biosQuery.data.totalPages}
        />
      ) : null}
    </div>
  );
}
