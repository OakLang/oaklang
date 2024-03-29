'use client';

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Card } from '~/components/ui/card';
import Link from 'next/link';
import { LuUser } from 'react-icons/lu';
import { Skeleton } from '~/components/ui/skeleton';
import { api } from '~/trpc/client';

export default function LeadersList() {
  const topIntegrationsQuery = api.integrations.topIntegrations.useQuery();

  if (topIntegrationsQuery.isLoading) {
    return (
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    );
  }

  if (topIntegrationsQuery.isError) {
    return (
      <div className="p-4 text-muted-foreground">
        <p>{topIntegrationsQuery.error.message}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2">
      {topIntegrationsQuery.data
        .filter((i) => i.users.length > 0 && !!i.integration.icon)
        .map((i) => {
          return (
            <Card className="hover:bg-muted" key={i.integration.name}>
              <Link href={`/leaders/${i.id}`}>
                <div className="items-top flex gap-0 p-4">
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className="h-10 w-10 fill-foreground"
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{ __html: i.integration.icon ?? '' }}
                    />
                    <div className="h-16 w-px bg-border" />
                  </div>
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <h3 className="mb-2 mt-2 truncate pl-3 font-semibold leading-6">{i.integration.name}</h3>
                    <ul className="list-outside list-disc pl-5 align-middle">
                      {i.users.map((user, index) => {
                        const opacity = index === 0 ? 'opacity-80' : index === 1 ? 'opacity-50' : 'opacity-20';
                        return (
                          <li className={`relative mb-1 ${opacity}`} key={`${i.integration.name}${user.user.id}`}>
                            <div className="relative top-1 flex flex-1 gap-2 overflow-hidden">
                              <Avatar className="h-5 w-5 ">
                                <AvatarImage src={user.user.avatarUrl} />
                                <AvatarFallback>
                                  <LuUser size={12} />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 overflow-hidden">
                                <p className="truncate text-sm font-semibold leading-5">
                                  {user.user.name ?? `@${user.user.username ?? user.user.id}`}
                                  <span className="ml-1.5 text-xs font-light">{user.badgeText}</span>
                                </p>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </Link>
            </Card>
          );
        })}
    </div>
  );
}
