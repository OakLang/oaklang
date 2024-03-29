import { Tabs, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Dialog } from 'src/components/shared/Dialog';
import { cn } from '~/utils';
import type { PublicList, PublicUser } from '~/utils/types';
import { TabsContent } from 'src/components/ui/tabs';
import { useInView } from 'react-intersection-observer';
import UserListSkeleton from 'src/components/UserListSkeleton';
import UserListItem from 'src/components/UserListItem';
import { LuLoader2, LuSearch, LuX } from 'react-icons/lu';
import { Button } from 'src/components/ui/button';
import { useToast } from 'src/components/ui/use-toast';
import type { TRPCError } from '@trpc/server';
import { Input } from 'src/components/ui/input';
import { api } from '~/trpc/client';

const tabs: { id: string; label: string }[] = [
  {
    id: 'members',
    label: 'Members',
  },
  {
    id: 'suggested',
    label: 'Suggested',
  },
];

export default function ManageMembersDialog({ children, list }: { children: ReactNode; list: PublicList }) {
  const [open, setOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(tabs[0]?.id);

  return (
    <Dialog className="h-[620px] max-w-xl" onOpenChange={setOpen} open={open} title="Manage Members" trigger={children}>
      <Tabs value={selectedTab}>
        <TabsList className="sticky top-0 z-20 flex h-12 border-b bg-card">
          {tabs.map((tab) => {
            const selected = tab.id === selectedTab;
            return (
              <TabsTrigger asChild key={tab.id} value={tab.id}>
                <button
                  className={cn(
                    'relative flex flex-1 items-center justify-center text-muted-foreground hover:bg-secondary/80 hover:text-accent-foreground',
                    {
                      'text-accent-foreground': selected,
                    },
                  )}
                  onClick={() => setSelectedTab(tab.id)}
                  type="button"
                >
                  <div className="relative flex h-full items-center">
                    {tab.label}
                    {tab.id === 'members' ? ` (${list.membersCount})` : ''}
                    <div
                      className={cn('absolute bottom-0 left-0 right-0 h-1 rounded-full bg-primary opacity-0', {
                        'opacity-100': selected,
                      })}
                    />
                  </div>
                </button>
              </TabsTrigger>
            );
          })}
        </TabsList>
        <TabsContent className="mt-0" value="members">
          <Members list={list} />
        </TabsContent>
        <TabsContent className="mt-0" value="suggested">
          <Suggested list={list} />
        </TabsContent>
      </Tabs>
    </Dialog>
  );
}

const Members = ({ list }: { list: PublicList }) => {
  const { ref, inView } = useInView();
  const { toast } = useToast();
  const membersQuery = api.list.getMembers.useInfiniteQuery(
    { listId: list.id },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
  const utils = api.useUtils();
  const removeMemberMut = api.list.removeMember.useMutation();

  const haveNextPage = useMemo(() => !!membersQuery.data?.pages.at(-1)?.nextCursor, [membersQuery.data?.pages]);
  const memberList = useMemo(() => membersQuery.data?.pages.flatMap((page) => page.items) ?? [], [membersQuery.data?.pages]);

  const handleRemoveMember = useCallback(
    async (userId: string) => {
      try {
        await removeMemberMut.mutateAsync({ listId: list.id, userId });
        void membersQuery.refetch();
        void utils.list.getList.invalidate({ listId: list.id });
        void utils.list.timeline.invalidate({ listId: list.id });
      } catch (error: unknown) {
        toast({ description: (error as TRPCError).message, title: 'Failed to remove member', variant: 'destructive' });
      }
    },
    [list.id, membersQuery, removeMemberMut, toast, utils.list.getList, utils.list.timeline],
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
      <div className="p-6">
        <p>Error: {membersQuery.error.message}</p>
      </div>
    );
  }

  if (memberList.length === 0) {
    return (
      <div className="p-6">
        <p className="text-xl font-bold">This List is lonely</p>
        <p className="text-muted-foreground">People added to this List will show up here.</p>
      </div>
    );
  }

  return (
    <div>
      {memberList.map((member) => {
        const isLoading = removeMemberMut.variables?.userId === member.id && removeMemberMut.isLoading;

        return (
          <UserListItem
            action={
              <Button disabled={isLoading} onClick={() => handleRemoveMember(member.id)} variant="destructive">
                {isLoading ? <LuLoader2 className="-ml-1 mr-2 h-5 w-5" /> : null}
                Remove
              </Button>
            }
            avatarUrl={member.avatarUrl}
            isLoading={isLoading}
            key={member.id}
            name={member.name ?? member.username ?? member.id}
            username={member.username ?? member.id}
          />
        );
      })}
      {haveNextPage ? (
        <div className="flex h-80 items-center justify-center" ref={ref}>
          <LuLoader2 className="animate-spin" size={24} />
        </div>
      ) : null}
    </div>
  );
};

const Suggested = ({ list }: { list: PublicList }) => {
  const { ref, inView } = useInView();
  const [searchText, setSearchText] = useState('');
  const [query, setQuery] = useState('');
  const [addedMemberIds, setAddedMemberIds] = useState<string[]>([]);
  const searchResult = api.search.searchUsers.useInfiniteQuery(
    { query: query || list.name },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
  const { toast } = useToast();
  const addMemberMut = api.list.addMember.useMutation();
  const removeMemberMut = api.list.removeMember.useMutation();
  const utils = api.useUtils();

  const haveNextPage = useMemo(() => !!searchResult.data?.pages.at(-1)?.nextCursor, [searchResult.data?.pages]);

  const handleAddMember = useCallback(
    async (user: PublicUser) => {
      try {
        await addMemberMut.mutateAsync({ listId: list.id, userId: user.id });
        setAddedMemberIds([...addedMemberIds, user.id]);
        void utils.list.getList.invalidate({ listId: list.id });
        void utils.list.timeline.invalidate({ listId: list.id });
      } catch (error: unknown) {
        toast({ description: (error as TRPCError).message, title: 'Failed to add member', variant: 'destructive' });
      }
    },
    [addMemberMut, addedMemberIds, list.id, toast, utils.list.getList, utils.list.timeline],
  );

  const handleRemoveMember = useCallback(
    async (user: PublicUser) => {
      try {
        await removeMemberMut.mutateAsync({ listId: list.id, userId: user.id });
        setAddedMemberIds(addedMemberIds.filter((id) => id !== user.id));
        void utils.list.getList.invalidate({ listId: list.id });
        void utils.list.timeline.invalidate({ listId: list.id });
      } catch (error: unknown) {
        toast({ description: (error as TRPCError).message, title: 'Failed to add member', variant: 'destructive' });
      }
    },
    [addedMemberIds, list.id, removeMemberMut, toast, utils.list.getList, utils.list.timeline],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(searchText);
    }, 200);

    return () => {
      clearTimeout(timeout);
    };
  }, [searchText]);

  useEffect(() => {
    if (inView && haveNextPage && !searchResult.isFetching) {
      void searchResult.fetchNextPage();
    }
  }, [haveNextPage, inView, searchResult]);

  return (
    <>
      <div className="sticky top-12 z-30 bg-card px-4 py-2">
        <div className="relative">
          <Input
            autoFocus
            className="px-10 focus:border-primary"
            onChange={(e) => setSearchText(e.currentTarget.value)}
            placeholder="Search people"
            value={searchText}
          />
          <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          {searchText ? (
            <button
              className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-foreground text-background"
              onClick={() => {
                setSearchText('');
                setQuery('');
              }}
              type="button"
            >
              <LuX className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {searchResult.isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LuLoader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : searchResult.isError ? (
        <div className="p-4">
          <p className="text-muted-foreground">{searchResult.error.message}</p>
        </div>
      ) : searchResult.data.pages.length === 0 || searchResult.data.pages[0]?.items.length === 0 ? (
        <div className="p-4">
          <p className="text-muted-foreground">No users found</p>
        </div>
      ) : (
        <>
          {searchResult.data.pages.map((page) => {
            return page.items.map((member) => {
              const isLoading =
                (addMemberMut.variables?.userId === member.id && addMemberMut.isLoading) ||
                (removeMemberMut.variables?.userId === member.id && removeMemberMut.isLoading);

              const isAdded = addedMemberIds.includes(member.id);

              return (
                <UserListItem
                  action={
                    isAdded ? (
                      <Button disabled={isLoading} onClick={() => handleRemoveMember(member)} variant="destructive">
                        {isLoading ? <LuLoader2 className="-ml-1 mr-2 h-5 w-5" /> : null}
                        Remove
                      </Button>
                    ) : (
                      <Button disabled={isLoading} onClick={() => handleAddMember(member)}>
                        {isLoading ? <LuLoader2 className="-ml-1 mr-2 h-5 w-5" /> : null}
                        Add
                      </Button>
                    )
                  }
                  avatarUrl={member.avatarUrl}
                  isLoading={isLoading}
                  key={member.id}
                  name={member.name ?? member.username ?? member.id}
                  username={member.username ?? member.id}
                />
              );
            });
          })}
          {haveNextPage ? (
            <div className="flex h-80 items-center justify-center" ref={ref}>
              <LuLoader2 className="animate-spin" size={24} />
            </div>
          ) : null}
        </>
      )}
    </>
  );
};
