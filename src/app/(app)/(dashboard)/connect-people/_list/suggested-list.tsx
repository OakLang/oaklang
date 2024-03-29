'use client';

import type { TRPCError } from '@trpc/server';
import { useCallback, useState } from 'react';
import { useToast } from '~/components/ui/use-toast';
import type { PublicUser } from '~/utils/types';
import { useAuth } from '~/providers/AuthProvider';
import { api } from '~/trpc/client';
import UserListItem from '~/components/UserListItem';
import UserListSkeleton from '~/components/UserListSkeleton';

export default function SuggestedList({ user }: { user: PublicUser }) {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [followingIds, setFollowingIds] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const usersQuery = api.users.getSuggestedUsers.useQuery({ limit: 30, userId: user.id });
  const followUserMut = api.users.followUser.useMutation();
  const unfollowUserMut = api.users.unFollowUser.useMutation();

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
      } catch (error: unknown) {
        console.log(error);
        toast({ description: (error as TRPCError).message, title: 'Error', variant: 'destructive' });
      }
    },
    [followUserMut, followingIds, toast, unfollowUserMut],
  );

  if (usersQuery.isLoading) {
    return <UserListSkeleton />;
  }

  if (usersQuery.isError) {
    return (
      <div className="p-4 text-muted-foreground">
        <p>{usersQuery.error.message}</p>
      </div>
    );
  }

  if (usersQuery.data.length === 0) {
    return (
      <div className="p-4 text-muted-foreground">
        <p>No results.</p>
      </div>
    );
  }

  return (
    <div>
      {usersQuery.data.map((item) => {
        const isFollowing = followingIds[item.id] === true;
        const isLoading =
          (followUserMut.variables === item.id && followUserMut.isLoading) ||
          (unfollowUserMut.variables === item.id && unfollowUserMut.isLoading);
        return (
          <UserListItem
            avatarUrl={item.avatarUrl}
            badgeText={item.doesFollowMe ? 'Follows you' : undefined}
            isFollowing={isFollowing}
            isLoading={isLoading}
            key={item.id}
            name={item.name ?? item.username ?? item.id}
            onToggleFollowing={
              isAuthLoading ? undefined : currentUser && currentUser.id === item.id ? undefined : () => onToggleFollow(item, !isFollowing)
            }
            username={item.username ?? item.id}
          />
        );
      })}
    </div>
  );
}
