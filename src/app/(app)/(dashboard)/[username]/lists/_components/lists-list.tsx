'use client';

import Link from 'next/link';
import pluralize from 'pluralize';
import { LuList, LuLoader2, LuUser } from 'react-icons/lu';
import { useAuth } from '~/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { formatNumber } from '~/utils';
import { api } from '~/trpc/client';

export default function ListsList({ username }: { username: string }) {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const listsQuery = api.list.getListsForUser.useInfiniteQuery(
    { username },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  if (listsQuery.isLoading || isAuthLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LuLoader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (listsQuery.isError) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">{listsQuery.error.message}</p>
      </div>
    );
  }

  return (
    <div>
      {currentUser && username === currentUser.username ? (
        <div className="p-4">
          <h2 className="text-xl font-bold">Your Lists</h2>
        </div>
      ) : null}
      {(listsQuery.data.pages.at(0)?.items.length ?? 0) === 0 ? (
        currentUser && username === currentUser.username ? (
          <div className="p-4 pt-0">
            <p className="text-muted-foreground">You haven&apos;t created or followed any Lists. When you do, they&apos;ll show up here.</p>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-2xl font-bold">@{username} hasn&apos;t created any Lists</p>
            <p className="mt-2 text-muted-foreground">When they do, they’ll show up here.</p>
          </div>
        )
      ) : (
        <div>
          {listsQuery.data.pages.map((page) =>
            page.items.map((list) => {
              console.log(list);
              const iAmOwner = !!currentUser && list.userId === currentUser.id;
              return (
                <div className="group relative" key={list.id}>
                  <Link
                    className="absolute inset-0 group-focus-within:bg-secondary/50 group-hover:bg-secondary/50"
                    href={`/lists/${list.id}`}
                  />
                  <div className="pointer-events-none relative flex items-center gap-4 px-4 py-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <LuList className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{list.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {' • '}
                          {formatNumber(list.membersCount)} {pluralize('member', list.membersCount)}
                        </p>
                      </div>
                      {iAmOwner ? (
                        <Link
                          className="group/user peer pointer-events-auto inline-flex items-center gap-2 text-sm outline-none"
                          href={list.user.url}
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={list.user.avatarUrl} />
                            <AvatarFallback>
                              <LuUser className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium hover:underline group-focus/user:underline">
                            {list.user.name ?? list.user.username ?? list.user.id}
                          </span>
                          <span className="text-muted-foreground">@{list.user.username ?? list.user.id}</span>
                        </Link>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(list.followersCount)} {pluralize('follower', list.followersCount)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }),
          )}
        </div>
      )}
    </div>
  );
}
