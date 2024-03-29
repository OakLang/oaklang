'use client';

import { LuLoader2, LuUser } from 'react-icons/lu';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import type { PublicUser } from '~/utils/types';
import type { TRPCError } from '@trpc/server';
import { useToast } from 'src/components/ui/use-toast';
import FollowButton from 'src/components/FollowButton';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from 'src/components/ui/avatar';
import { api } from '~/trpc/client';
import { useAuth } from '~/providers/AuthProvider';
import { useParams } from 'next/navigation';

const SuggestedUsersWidget = () => {
  const params = useParams<{ username?: string }>();
  const { currentUser } = useAuth();
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const { toast } = useToast();
  const utils = api.useUtils();
  const userQuery = api.users.publicProfileInfo.useQuery(params.username ?? '', { enabled: !!params.username, retry: false });
  const usersQuery = api.users.getSuggestedUsers.useQuery(
    { limit: 3, userId: userQuery.data?.id },
    {
      enabled: params.username ? userQuery.isSuccess : true,
    },
  );
  const followUserMut = api.users.followUser.useMutation();
  const unfollowUserMut = api.users.unFollowUser.useMutation();

  const onToggleFollow = useCallback(
    async (user: PublicUser) => {
      try {
        if (followingIds.includes(user.id)) {
          await unfollowUserMut.mutateAsync(user.id);
          setFollowingIds(followingIds.filter((id) => id !== user.id));
        } else {
          await followUserMut.mutateAsync(user.id);
          setFollowingIds([...followingIds, user.id]);
        }
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

  if (params.username && userQuery.isLoading) {
    return (
      <Card className="flex items-center justify-center py-16">
        <LuLoader2 className="h-6 w-6 animate-spin" size={24} />
      </Card>
    );
  }

  if (params.username && userQuery.isError) {
    return null;
  }

  if (!userQuery.data?.id && !currentUser?.id) {
    return null;
  }

  if (usersQuery.isLoading) {
    return (
      <Card className="flex items-center justify-center py-16">
        <LuLoader2 className="h-6 w-6 animate-spin" size={24} />
      </Card>
    );
  }

  if (usersQuery.isError || usersQuery.data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{userQuery.isSuccess ? 'You might like' : 'Who to follow'}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {usersQuery.data.map((user) => {
          const isFollowing = followingIds.includes(user.id);
          const isLoading =
            (followUserMut.variables === user.id && followUserMut.isLoading) ||
            (unfollowUserMut.variables === user.id && unfollowUserMut.isLoading);
          return (
            <div className="relative flex items-center py-2 pr-4 hover:bg-secondary/80" key={user.id}>
              <Link className="flex flex-1 items-center gap-2 overflow-hidden px-4 py-2" href={`/${user.username ?? user.id}`}>
                <Avatar className="hover:opacity-80">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback>
                    <LuUser size={20} />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-semibold leading-5 hover:underline">{user.name ?? user.username}</p>
                  <div className="flex items-center gap-1">
                    <p className="truncate leading-5 text-muted-foreground">@{user.username}</p>
                    {user.doesFollowMe ? (
                      <p className="whitespace-pre rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                        Follows you
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
              <FollowButton
                isFollowing={isFollowing}
                isLoading={isLoading}
                onClick={() => onToggleFollow(user)}
                size="sm"
                userName={user.name ?? user.username ?? undefined}
              />
            </div>
          );
        })}
      </CardContent>
      <Link
        className="flex px-4 py-3 font-medium text-accent-foreground hover:bg-secondary/80 hover:underline"
        href={{
          pathname: '/connect-people',
          query: {
            userId: userQuery.data?.id ?? currentUser?.id,
          },
        }}
      >
        Show more
      </Link>
    </Card>
  );
};

export default SuggestedUsersWidget;
