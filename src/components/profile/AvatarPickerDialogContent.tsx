import { Avatar, AvatarFallback, AvatarImage } from 'src/components/ui/avatar';
import { LuCheck, LuUser } from 'react-icons/lu';
import { OnboardingStep, stepToPath } from '~/stores/onboarding-store';
import { Button } from 'src/components/ui/button';
import Link from 'next/link';
import type { ProfileDefaultType } from '~/server/schema';
import { cn } from '~/utils';
import { useMemo } from 'react';
import { api } from '~/trpc/client';

export default function AvatarPickerDialogContent({ userId, onSelect }: { onSelect?: (connectionId: string) => void; userId: string }) {
  const integrationsQuery = api.users.getIntegrations.useQuery({ userId });
  const integrations = useMemo(() => integrationsQuery.data ?? [], [integrationsQuery.data]);

  return (
    <div className="p-6 pt-0">
      {integrations.length === 0 ? (
        <div className="py-8">
          <p className="text-center text-muted-foreground">
            <Link className="font-medium text-foreground hover:underline" href={stepToPath.get(OnboardingStep.second) ?? '/onboard'}>
              Connect an account
            </Link>{' '}
            to change your avatar
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {integrations.map((integration) => {
            return integration.connections.map((c) => {
              const selected = !!((integration as unknown as { profileDefaults?: ProfileDefaultType[] }).profileDefaults ?? []).find(
                (p) => p.defaultType === 'avatar' && p.integrationId === c.id,
              );
              if (!c.avatar) {
                return null;
              }
              return (
                <Button
                  className={cn(
                    'relative h-auto flex-col items-center justify-center overflow-hidden whitespace-normal rounded-lg p-4 text-left text-muted-foreground',
                    {
                      'bg-muted text-foreground': selected,
                    },
                  )}
                  key={c.id}
                  onClick={() => onSelect?.(c.id)}
                  variant="outline"
                >
                  <Avatar className="relative h-16 w-16 sm:h-20 sm:w-20">
                    <AvatarImage src={c.avatar} />
                    <AvatarFallback>
                      <LuUser size={24} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="mt-2 flex w-full items-center justify-center gap-2 text-center">
                    <span
                      className="h-5 w-5 flex-shrink-0 fill-current"
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{ __html: integration.icon }}
                    />
                    <p className="truncate">@{c.providerAccountUsername}</p>
                  </div>
                  {selected ? (
                    <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <LuCheck size={14} />
                    </div>
                  ) : null}
                </Button>
              );
            });
          })}
        </div>
      )}
    </div>
  );
}
