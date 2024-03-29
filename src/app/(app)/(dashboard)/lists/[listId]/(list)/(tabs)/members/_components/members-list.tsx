'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import type { PublicUser } from '~/utils/types';
import type { TRPCError } from '@trpc/server';
import { LuLoader2 } from 'react-icons/lu';
import { useToast } from '~/components/ui/use-toast';
import UserListItem from '~/components/UserListItem';
import UserListSkeleton from '~/components/UserListSkeleton';
import { api } from '~/trpc/client';
import { useAuth } from '~/providers/AuthProvider';

export default function MembersList({ listId }: { listId: string }) {
  const { isLoading: isAuthLoading, currentUser } = useAuth();
  const { ref, inView } = useInView();
  const [followingIds, setFollowingIds] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const membersQuery = api.list.getMembers.useInfiniteQuery({ listId }, { getNextPageParam: (lastPage) => lastPage.nextCursor });
  const utils = api.useUtils();
  const followUserMut = api.users.followUser.useMutation();
  const unfollowUserMut = api.users.unFollowUser.useMutation();

  const haveNextPage = useMemo(() => !!membersQuery.data?.pages.at(-1)?.nextCursor, [membersQuery.data?.pages]);

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
    if (inView && haveNextPage && !membersQuery.isFetching) {
      void membersQuery.fetchNextPage();
    }
  }, [haveNextPage, inView, membersQuery]);

  if (membersQuery.isLoading) {
    return <UserListSkeleton />;
  }

  if (membersQuery.isError) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">{membersQuery.error.message}</p>
      </div>
    );
  }

  if (membersQuery.data.pages.length === 0 || membersQuery.data.pages[0]!.items.length === 0) {
    return (
      <div className="p-4">
        <p className="text-xl font-bold">This List is lonely</p>
        <p className="text-muted-foreground">People added to this List will show up here.</p>
      </div>
    );
  }

  return (
    <div>
      {membersQuery.data.pages.map((page) =>
        page.items.map((follower) => {
          const isFollowing = followingIds[follower.id] ?? follower.isFollowing;
          const isLoading =
            (followUserMut.variables === follower.id && followUserMut.isLoading) ||
            (unfollowUserMut.variables === follower.id && unfollowUserMut.isLoading);

          return (
            <UserListItem
              avatarUrl={follower.avatarUrl}
              badgeText={currentUser?.id === follower.id ? 'You' : follower.doesFollowMe ? 'Follows you' : undefined}
              isFollowing={isFollowing}
              isLoading={isLoading}
              key={follower.id}
              name={follower.name ?? follower.username ?? follower.id}
              onToggleFollowing={
                isAuthLoading
                  ? undefined
                  : currentUser && currentUser.id === follower.id
                    ? undefined
                    : () => onToggleFollow(follower, !isFollowing)
              }
              username={follower.username ?? follower.id}
            />
          );
        }),
      )}
      {haveNextPage ? (
        <div className="flex h-80 items-center justify-center" ref={ref}>
          <LuLoader2 className="animate-spin" size={24} />
        </div>
      ) : null}
    </div>
  );
}
