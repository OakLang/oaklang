'use client';

import { useEffect, useMemo } from 'react';
import { LuLoader2 } from 'react-icons/lu';
import { useInView } from 'react-intersection-observer';
import TimelineFeedItem from '~/components/TimelineFeedItem';
import { api } from '~/trpc/client';

export default function ListTimelineFeed({ listId }: { listId: string }) {
  const { ref, inView } = useInView();
  const timelineQuery = api.list.timeline.useInfiniteQuery(
    { listId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const haveNextPage = useMemo(() => !!timelineQuery.data?.pages.at(-1)?.nextCursor, [timelineQuery.data?.pages]);

  useEffect(() => {
    if (inView && haveNextPage && !timelineQuery.isFetching) {
      void timelineQuery.fetchNextPage();
    }
  }, [haveNextPage, inView, timelineQuery]);

  if (timelineQuery.isLoading) {
    return (
      <div className="space-y-4 p-4">
        <TimelineFeedItem />
        <TimelineFeedItem />
        <TimelineFeedItem />
        <TimelineFeedItem />
        <TimelineFeedItem />
      </div>
    );
  }

  if (timelineQuery.isError) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">{timelineQuery.error.message}</p>
      </div>
    );
  }

  if (timelineQuery.data.pages.length === 0 || timelineQuery.data.pages[0]?.items.length === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">No items to show</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {timelineQuery.data.pages.map((page) => page.items.map((item) => <TimelineFeedItem feedItem={item} key={item.id} />))}

      {haveNextPage ? (
        <div className="flex h-80 items-center justify-center" ref={ref}>
          <LuLoader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : null}
    </div>
  );
}
