'use client';

import { useEffect, useMemo } from 'react';
import { LuLoader2 } from 'react-icons/lu';
import { useInView } from 'react-intersection-observer';
import UserListItem from '~/components/UserListItem';
import UserListSkeleton from 'src/components/UserListSkeleton';
import { api } from '~/trpc/client';

const UserSearchResult = ({ searchText }: { searchText: string }) => {
  const { ref, inView } = useInView();
  const usersQuery = api.search.searchUsers.useInfiniteQuery(
    { query: searchText },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const haveNextPage = useMemo(() => !!usersQuery.data?.pages.at(-1)?.nextCursor, [usersQuery.data?.pages]);

  useEffect(() => {
    if (inView && haveNextPage && !usersQuery.isFetching) {
      void usersQuery.fetchNextPage();
    }
  }, [haveNextPage, inView, usersQuery]);

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

  if ((usersQuery.data.pages.at(0)?.items.length ?? 0) === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <>
      {usersQuery.data.pages
        .flatMap((page) => page.items)
        .map((user) => (
          <UserListItem
            avatarUrl={user.avatarUrl}
            isFollowing={false}
            key={user.id}
            name={user.name ?? user.username ?? user.id}
            username={user.username ?? user.id}
          />
        ))}
      {haveNextPage ? (
        <div className="flex h-80 items-center justify-center" ref={ref}>
          <LuLoader2 className="animate-spin" size={24} />
        </div>
      ) : null}
    </>
  );
};

export default UserSearchResult;
