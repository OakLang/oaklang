'use client';

import Link from 'next/link';
import pluralize from 'pluralize';
import { useCallback } from 'react';
import { LuUser } from 'react-icons/lu';
import { useAuth } from '~/providers/AuthProvider';
import FollowButton from '~/components/FollowButton';
import EditListDialog from '~/components/dialogs/EditListDialog';
import ManageMembersDialog from '~/components/dialogs/ManageMembersDialog';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { api } from '~/trpc/client';
import type { PublicList } from '~/utils/types';

export default function ListDetails({ list }: { list: PublicList }) {
  const { currentUser, isLoading } = useAuth();
  const listQuery = api.list.getList.useQuery({ listId: list.id }, { initialData: list });
  const isFollowingQuery = api.list.isFollowingList.useQuery({ listId: list.id });
  const followListMut = api.list.followList.useMutation();
  const unfollowListMut = api.list.unfollowList.useMutation();

  const handleToggleFollow = useCallback(async () => {
    if (isFollowingQuery.isLoading) {
      return;
    }

    if (isFollowingQuery.data) {
      await unfollowListMut.mutateAsync({ listId: list.id });
    } else {
      await followListMut.mutateAsync({ listId: list.id });
    }

    void isFollowingQuery.refetch();
  }, [followListMut, isFollowingQuery, list.id, unfollowListMut]);

  if (listQuery.isError) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">{listQuery.error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center border-b px-4 py-8">
      <p className="text-center text-xl font-bold">{listQuery.data.name}</p>
      {!!listQuery.data.description && <p className="mt-2 text-center text-muted-foreground">{listQuery.data.description}</p>}
      <Link className="group/link mt-4 inline-flex items-center gap-1" href={listQuery.data.user.url}>
        <Avatar className="h-6 w-6">
          <AvatarImage src={listQuery.data.user.avatarUrl} />
          <AvatarFallback>
            <LuUser className="h-3 w-3" />
          </AvatarFallback>
        </Avatar>
        <span className="font-medium group-hover/link:underline">{listQuery.data.user.name ?? listQuery.data.user.username}</span>{' '}
        <span className="text-muted-foreground">@{listQuery.data.user.username}</span>
      </Link>
      <div className="mt-2 flex items-center gap-4">
        <Link className="hover:underline" href={`/lists/${list.id}/members`}>
          <span className="font-medium">{listQuery.data.membersCount}</span>{' '}
          <span className="text-muted-foreground">{pluralize('member', listQuery.data.membersCount)}</span>
        </Link>
        <Link className="hover:underline" href={`/lists/${list.id}/followers`}>
          <span className="font-medium">{listQuery.data.followersCount}</span>{' '}
          <span className="text-muted-foreground">{pluralize('follower', listQuery.data.followersCount)}</span>
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {isLoading ? (
          <Skeleton className="h-10 w-32" />
        ) : currentUser?.id === listQuery.data.userId ? (
          <>
            <EditListDialog list={listQuery.data}>
              <Button variant="outline">Edit List</Button>
            </EditListDialog>
            <ManageMembersDialog list={listQuery.data}>
              <Button variant="outline">Manage Members</Button>
            </ManageMembersDialog>
          </>
        ) : isFollowingQuery.isLoading ? null : (
          <FollowButton
            isFollowing={isFollowingQuery.data === true}
            isLoading={followListMut.isLoading || unfollowListMut.isLoading}
            onClick={handleToggleFollow}
            userName={listQuery.data.name}
          />
        )}
      </div>
    </div>
  );
}
