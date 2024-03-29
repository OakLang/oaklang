'use client';

import Link from 'next/link';
import { badgeInfoForConnection, urlForConnection } from '~/integrations/extensions/getters';
import { api } from '~/trpc/client';
import { formatNumberWithSuffix } from '~/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { LuExternalLink, LuLoader2 } from 'react-icons/lu';
import { Button } from '~/components/ui/button';

export default function UserDetails({ userId }: { userId: string }) {
  const userQuery = api.admin.getUser.useQuery(userId);
  const generateLoginUrl = api.admin.generateLoginUrl.useMutation();
  const banForSpam = api.admin.banUserForSpam.useMutation();

  return (
    <div className="container max-w-screen-xl space-y-8 px-4 py-8">
      {userQuery.isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <LuLoader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : userQuery.isError ? (
        <div className="text-muted-foreground">
          <p>{userQuery.error.message}</p>
        </div>
      ) : !userQuery.data ? (
        <div className="text-muted-foreground">
          <p>User not found!</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="text-lg font-semibold">
                {userQuery.data.username ? (
                  <Link className="hover:underline" href={`/${userQuery.data.username}`} rel="nofollow noopener" target="_blank">
                    User {userQuery.data.username}
                    <LuExternalLink className="ml-1 inline h-3.5 w-3.5" />
                  </Link>
                ) : (
                  `User ${userQuery.data.id}`
                )}
              </div>
              <p className="text-sm text-muted-foreground">Created {userQuery.data.createdAt.toISOString()}</p>
            </div>
            <Button onClick={() => generateLoginUrl.mutate({ userId })} variant="outline">
              Generate login url
            </Button>
            <Button onClick={() => banForSpam.mutate(userId)} variant="destructive">
              Ban user for spam
            </Button>
          </div>

          {!!generateLoginUrl.data && (
            <div>
              <Link className=" font-medium hover:underline" href={generateLoginUrl.data}>
                {generateLoginUrl.data}
              </Link>
            </div>
          )}

          <hr className="h-px bg-border" />

          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <p className="text-muted-foreground">{formatNumberWithSuffix(userQuery.data.integrations.length, 'integration')}</p>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Id</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Badge text</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userQuery.data.integrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <p className="text-muted-foreground">No integrations</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  userQuery.data.integrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell>
                        <Link className="font-medium hover:underline" href={`/admin/users/${userId}/integrations/${integration.id}`}>
                          {integration.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link className="font-medium hover:underline" href={`/admin/integrations/${integration.provider}`}>
                          {integration.provider}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          className="font-medium hover:underline"
                          href={urlForConnection(integration)}
                          rel="nofollow noopener"
                          target="_blank"
                          title={integration.providerAccountId}
                        >
                          {integration.providerAccountUsername}
                          <LuExternalLink className="ml-1 inline h-3.5 w-3.5" />
                        </Link>
                      </TableCell>
                      <TableCell>{badgeInfoForConnection(integration).badgeText}</TableCell>
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
