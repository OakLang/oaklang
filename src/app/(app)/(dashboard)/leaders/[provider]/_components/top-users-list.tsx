'use client';

import type { TRPCError } from '@trpc/server';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuLoader2 } from 'react-icons/lu';
import { useInView } from 'react-intersection-observer';
import { useAuth } from '~/providers/AuthProvider';
import UserListItem from '~/components/UserListItem';
import UserListSkeleton from '~/components/UserListSkeleton';
import { useToast } from '~/components/ui/use-toast';
import { useLeadersFilterOptions } from '~/stores/leaders-filter-options-store';
import { api } from '~/trpc/client';
import type { PublicUser } from '~/utils/types';

export default function TopUsersList({ provider }: { provider: string }) {
  const { ref, inView } = useInView();
  const { isLoading: isAuthLoading, currentUser } = useAuth();
  const [followingIds, setFollowingIds] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const filter = useLeadersFilterOptions();
  const topUsersQuery = api.integrations.topUsersForIntegration.useInfiniteQuery(
    { filter, provider },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
  const utils = api.useUtils();
  const followUserMut = api.users.followUser.useMutation();
  const unfollowUserMut = api.users.unFollowUser.useMutation();
  const haveNextPage = useMemo(() => !!topUsersQuery.data?.pages.at(-1)?.nextCursor, [topUsersQuery.data?.pages]);

  const onToggleFollow = useCallback(
    async (user: PublicUser, follow: boolean) => {
      try {
        const followingIdsCopy = { ...followingIds };
        if (follow) {
          await followUserMut.mutateAsync(user.id);
          followingIdsCopy[user.id] = true;
        } else {
          await unfollowUserMut.mutateAsync(user.id);
          followingIdsCopy[user.id] = false;
        }
        setFollowingIds(followingIdsCopy);
        await utils.users.publicProfileInfo.invalidate(currentUser?.username ?? currentUser?.id);
        await utils.users.isFollowingUser.invalidate(user.id);
      } catch (error: unknown) {
        console.log(error);
        toast({ description: (error as TRPCError).message, title: 'Error', variant: 'destructive' });
      }
    },
    [
      currentUser?.id,
      currentUser?.username,
      followUserMut,
      followingIds,
      toast,
      unfollowUserMut,
      utils.users.isFollowingUser,
      utils.users.publicProfileInfo,
    ],
  );

  useEffect(() => {
    if (inView && haveNextPage && !topUsersQuery.isFetching) {
      void topUsersQuery.fetchNextPage();
    }
  }, [haveNextPage, inView, topUsersQuery]);

  if (topUsersQuery.isLoading) {
    return <UserListSkeleton />;
  }

  if (topUsersQuery.isError) {
    return (
      <div className="p-4 text-muted-foreground">
        <p>{topUsersQuery.error.message}</p>
      </div>
    );
  }

  if ((topUsersQuery.data.pages.at(0)?.items.length ?? 0) === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <div>
      {topUsersQuery.data.pages.map((page) => {
        return page.items.map((user) => {
          const isFollowing = followingIds[user.id] ?? user.isFollowing;
          const isLoading =
            (followUserMut.variables === user.id && followUserMut.isLoading) ||
            (unfollowUserMut.variables === user.id && unfollowUserMut.isLoading);
          return (
            <UserListItem
              avatarUrl={user.avatarUrl}
              badgeText={currentUser?.id === user.id ? 'You' : user.doesFollowMe ? 'Follows you' : undefined}
              isFollowing={isFollowing}
              isLoading={isLoading}
              key={user.id}
              name={user.name ?? user.username ?? user.id}
              onToggleFollowing={
                isAuthLoading ? undefined : currentUser && currentUser.id === user.id ? undefined : () => onToggleFollow(user, !isFollowing)
              }
              subtitle={user.badgeText}
              username={user.username ?? user.id}
            />
          );
        });
      })}
      {haveNextPage ? (
        <div className="flex h-80 items-center justify-center" ref={ref}>
          <LuLoader2 className="animate-spin" size={24} />
        </div>
      ) : null}
    </div>
  );
}
