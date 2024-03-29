'use client';

import { Tabs, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { formatNumber } from '~/utils';
import { cn } from '~/utils';
import type { PublicUser } from '~/utils/types';

const tabs: { id: string; label: string }[] = [
  {
    id: 'followers',
    label: 'Followers',
  },
  {
    id: 'following',
    label: 'Following',
  },
];

export default function FollowerFollowingTabs({ user }: { user: PublicUser }) {
  const pathname = usePathname();
  const selectedTab = useMemo(() => pathname.split('/').at(-1), [pathname]);

  return (
    <Tabs value={selectedTab}>
      <TabsList className="flex h-12">
        {tabs.map((tab) => {
          const selected = tab.id === selectedTab;
          const count = tab.id === 'followers' ? user.followersCount : user.followingCount;
          return (
            <TabsTrigger asChild key={tab.id} value={tab.id}>
              <Link
                className={cn(
                  'relative flex flex-1 items-center justify-center text-muted-foreground hover:bg-secondary/80 hover:text-accent-foreground',
                  {
                    'text-accent-foreground': selected,
                  },
                )}
                href={`/${user.username ?? user.id}/${tab.id}`}
                replace
              >
                <div className="relative flex h-full items-center">
                  {tab.label} ({formatNumber(count)})
                  <div
                    className={cn('absolute bottom-0 left-0 right-0 h-1 rounded-full bg-primary opacity-0', {
                      'opacity-100': selected,
                    })}
                  />
                </div>
              </Link>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
