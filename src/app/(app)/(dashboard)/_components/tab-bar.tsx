'use client';

import { Tooltip, TooltipTrigger, TooltipContent } from '@radix-ui/react-tooltip';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { IoHomeSharp, IoHomeOutline, IoGlobeSharp, IoGlobeOutline, IoPeople, IoPeopleOutline } from 'react-icons/io5';
import { useAuth } from '~/providers/AuthProvider';
import { Skeleton } from '~/components/ui/skeleton';
import { cn } from '~/utils';

const ICON_SIZE = 26;

export default function TabBar() {
  const { currentUser, isLoading } = useAuth();
  const pathname = usePathname();
  const items = useMemo(
    (): { activeIcon: ReactNode; exact?: boolean; href: string; icon: ReactNode; label: string }[] =>
      currentUser
        ? [
            {
              activeIcon: <IoHomeSharp size={ICON_SIZE} />,
              href: '/home',
              icon: <IoHomeOutline size={ICON_SIZE} />,
              label: 'Home',
            },
            {
              activeIcon: <IoGlobeSharp size={ICON_SIZE} />,
              href: '/explore',
              icon: <IoGlobeOutline size={ICON_SIZE} />,
              label: 'Explore',
            },
            {
              activeIcon: <IoPeople size={ICON_SIZE} />,
              href: '/leaders',
              icon: <IoPeopleOutline size={ICON_SIZE} />,
              label: 'Leaders',
            },
          ]
        : [
            {
              activeIcon: <IoHomeSharp size={ICON_SIZE} />,
              exact: true,
              href: '/',
              icon: <IoHomeOutline size={ICON_SIZE} />,
              label: 'Home',
            },
            {
              activeIcon: <IoPeople size={ICON_SIZE} />,
              href: '/leaders',
              icon: <IoPeopleOutline size={ICON_SIZE} />,
              label: 'Leaders',
            },
          ],
    [currentUser],
  );

  return (
    <div className="sticky bottom-0 z-20 flex h-16 border-t bg-card md:hidden">
      {isLoading
        ? new Array(3).fill(1).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div className="flex flex-1 items-center justify-center" key={i}>
              <Skeleton className="rounded-full" style={{ height: ICON_SIZE, width: ICON_SIZE }} />
            </div>
          ))
        : items.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    className={cn('flex flex-1 items-center justify-center text-muted-foreground', {
                      'text-foreground': isActive,
                    })}
                    href={item.href}
                    type="button"
                  >
                    {isActive ? item.activeIcon : item.icon}
                    <p className="sr-only">{item.label}</p>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
    </div>
  );
}
