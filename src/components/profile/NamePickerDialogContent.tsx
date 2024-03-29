import { LuCheck } from 'react-icons/lu';
import { OnboardingStep, stepToPath } from '~/stores/onboarding-store';
import { Button } from 'src/components/ui/button';
import Link from 'next/link';
import type { ProfileDefaultType } from '~/server/schema';
import { cn } from '~/utils';
import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from 'src/components/ui/tooltip';
import { api } from '~/trpc/client';

export default function NamePickerDialogContent({ userId, onSelect }: { onSelect?: (connectionId: string) => void; userId: string }) {
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
        <div className="grid gap-4">
          {integrations.map((integration) => {
            return integration.connections.map((c) => {
              const selected = !!((integration as unknown as { profileDefaults?: ProfileDefaultType[] }).profileDefaults ?? []).find(
                (p) => p.defaultType === 'name' && p.integrationId === c.id,
              );
              if (!c.name) {
                return null;
              }
              return (
                <Button
                  className={cn(
                    'relative h-12 items-center gap-4 overflow-hidden whitespace-normal rounded-lg text-left text-muted-foreground',
                    {
                      'bg-muted text-foreground': selected,
                    },
                  )}
                  key={c.id}
                  onClick={() => onSelect?.(c.id)}
                  variant="outline"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="h-5 w-5 flex-shrink-0 fill-current"
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: integration.icon }}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="text-center">
                      <p>{integration.name}</p>
                      <p className="text-xs">@{c.providerAccountUsername}</p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="flex-1 truncate">{c.name}</p>
                  {selected ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
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
