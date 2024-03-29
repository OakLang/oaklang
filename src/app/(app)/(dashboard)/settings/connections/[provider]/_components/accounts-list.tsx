import { DialogClose } from '@radix-ui/react-dialog';
import type { TRPCError } from '@trpc/server';
import Link from 'next/link';
import { useCallback } from 'react';
import { LuLoader2, LuUser } from 'react-icons/lu';
import { Dialog } from '~/components/shared/Dialog';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { useToast } from '~/components/ui/use-toast';
import { api } from '~/trpc/client';
import { relativeDate } from '~/utils/helpers';
import type { PublicConnection } from '~/utils/types';

export default function AccountsList({ connections, provider }: { connections: PublicConnection[]; provider: string }) {
  const disconnectIntegrationMut = api.integrations.disconnectIntegration.useMutation();
  const { toast } = useToast();
  const utils = api.useUtils();

  const handleDisconnectIntegration = useCallback(
    async (connectionId: string) => {
      try {
        await disconnectIntegrationMut.mutateAsync({ connectionId, provider });
        void utils.integrations.integrationForUser.invalidate({ provider });
      } catch (error: unknown) {
        toast({ description: (error as TRPCError).message, title: 'Failed to disconnect!', variant: 'destructive' });
      }
    },
    [disconnectIntegrationMut, provider, toast, utils.integrations.integrationForUser],
  );

  return (
    <div>
      {connections.map((connection) => {
        const isLoading = disconnectIntegrationMut.isLoading && disconnectIntegrationMut.variables?.connectionId === connection.id;
        return (
          <div className="flex flex-1 items-center gap-4 p-4" key={connection.url}>
            <Avatar>
              <AvatarImage src={connection.avatar} />
              <AvatarFallback>
                <LuUser size={16} />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="line-clamp-1 text-sm font-semibold leading-5">{connection.name}</p>
              <p className="line-clamp-1 text-sm leading-5 text-muted-foreground">
                <Link className="font-medium text-primary hover:underline" href={connection.url} rel="nofollow noopener" target="_blank">
                  @{connection.providerAccountUsername}
                </Link>
                {' • '}connected {relativeDate(connection.createdAt)}
              </p>
            </div>
            <Dialog
              description="Are you sure you want to disconnect this account?"
              footer={
                <>
                  <DialogClose asChild>
                    <Button variant="secondary">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={() => handleDisconnectIntegration(connection.id)} variant="destructive">
                      Disconnect
                    </Button>
                  </DialogClose>
                </>
              }
              title="Disconnect Account?"
              trigger={
                <Button
                  className="pointer-events-auto border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={disconnectIntegrationMut.isLoading}
                  variant="outline"
                >
                  {isLoading ? <LuLoader2 className="-ml-1 mr-2 h-5 w-5 animate-spin" /> : null}
                  Disconnect
                </Button>
              }
            />
          </div>
        );
      })}
    </div>
  );
}
