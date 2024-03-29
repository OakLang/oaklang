'use client';

import type { SidebarItem } from '~/utils/types';
import { Skeleton } from './ui/skeleton';
import { cn, isSidebarItemActive } from '~/utils';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import Link from 'next/link';
import { Fragment } from 'react';

export default function StickySideBar({ items, isLoading }: { isLoading?: boolean; items: SidebarItem[] }) {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 flex h-screen flex-shrink-0 flex-col overflow-y-auto bg-card max-md:hidden lg:w-64">
      <div className="flex flex-col p-1 max-lg:items-center lg:p-4 lg:pl-2">
        {isLoading
          ? new Array(5).fill(1).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <div className="flex h-12 items-center justify-center gap-4 max-lg:w-12 lg:justify-start lg:px-3" key={i}>
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-16 max-lg:hidden" />
              </div>
            ))
          : items.map((item) => {
              const isActive = isSidebarItemActive(item, pathname);

              return (
                <Fragment key={item.href}>
                  <Button
                    asChild
                    className={cn(
                      'h-12 justify-center gap-4 rounded-lg text-muted-foreground max-lg:w-12 max-lg:px-0 lg:justify-start lg:px-3',
                      {
                        'font-extrabold text-primary': isActive,
                      },
                    )}
                    key={item.href}
                    variant="ghost"
                  >
                    <Link href={item.href}>
                      {isActive && item.activeIcon ? item.activeIcon : item.icon}
                      <p className="max-lg:hidden">{item.label}</p>
                    </Link>
                  </Button>
                  <div className="relative flex w-full flex-col pl-10">
                    <div className="absolute bottom-2 left-6 top-2 w-px bg-border" />
                    {item.children?.map((child) => {
                      const isChildActive = isSidebarItemActive(child as SidebarItem, pathname);
                      return (
                        <Button
                          asChild
                          className={cn(
                            'h-12 justify-center gap-4 rounded-lg text-muted-foreground max-lg:w-12 max-lg:px-0 lg:justify-start lg:px-3',
                            {
                              'font-extrabold text-primary': isChildActive,
                            },
                          )}
                          key={child.href}
                          variant="ghost"
                        >
                          <Link href={child.href}>{child.label}</Link>
                        </Button>
                      );
                    })}
                  </div>
                </Fragment>
              );
            })}
      </div>
    </div>
  );
}
