'use client';

import { useCallback } from 'react';
import { api } from '~/trpc/client';
import { formatNumberWithSuffix } from '~/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import Link from 'next/link';
import { Button } from '~/components/ui/button';
import { LuTrash2 } from 'react-icons/lu';
import { Skeleton } from '~/components/ui/skeleton';

export default function LinksList() {
  const tokensQuery = api.admin.getLoginTokens.useQuery();
  const deleteTokens = api.admin.deleteLoginTokensForUser.useMutation();

  const onDelete = useCallback(
    async (userId: string) => {
      await deleteTokens.mutateAsync(userId);
      await tokensQuery.refetch();
    },
    [deleteTokens, tokensQuery],
  );

  return (
    <div className="container max-w-screen-xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        {tokensQuery.isSuccess ? (
          <p className="text-muted-foreground">{formatNumberWithSuffix(tokensQuery.data.length, 'login link')}</p>
        ) : (
          <Skeleton className="h-6 w-32" />
        )}
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokensQuery.isLoading ? (
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
            ) : tokensQuery.isError ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="text-muted-foreground">{tokensQuery.error.message}</p>
                </TableCell>
              </TableRow>
            ) : tokensQuery.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="text-muted-foreground">No links</p>
                </TableCell>
              </TableRow>
            ) : (
              tokensQuery.data.map((item) => {
                return (
                  <TableRow key={item.createdAt.toISOString()}>
                    <TableCell>
                      <Link className="font-medium hover:underline" href={`/admin/users/${item.user.id}`}>
                        {item.user.username ?? item.user.id}
                      </Link>
                    </TableCell>
                    <TableCell>{item.createdAt.toISOString()}</TableCell>
                    <TableCell>{item.expiresAt.toISOString()}</TableCell>
                    <TableCell>{formatNumberWithSuffix(item.usedCount, 'time')}</TableCell>
                    <TableCell className="py-0">
                      <Button onClick={() => onDelete(item.user.id)} variant="outline">
                        <LuTrash2 className="-ml-1 mr-2 h-5 w-5" />
                        Delete Link
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
