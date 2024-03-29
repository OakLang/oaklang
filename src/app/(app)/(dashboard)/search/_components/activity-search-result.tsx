'use client';

import { useEffect, useMemo } from 'react';
import type { FeedItem } from '~/utils/types';
import { LuLoader2 } from 'react-icons/lu';
import TimelineFeedItem from '~/components/TimelineFeedItem';
import { useInView } from 'react-intersection-observer';
import { api } from '~/trpc/client';

const ActivitySearchResult = ({ searchText }: { searchText: string }) => {
  const { ref, inView } = useInView();

  const timelineQuery = api.search.searchActivities.useInfiniteQuery(
    { query: searchText },
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

  if ((timelineQuery.data.pages.at(0)?.items.length ?? 0) === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">No result found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {timelineQuery.data.pages
        .flatMap((page) => page.items)
        .map((item) => (
          <TimelineFeedItem feedItem={item} key={(item as FeedItem).id} />
        ))}
      {haveNextPage ? (
        <div className="flex h-80 items-center justify-center" ref={ref}>
          <LuLoader2 className="animate-spin" size={24} />
        </div>
      ) : null}
    </div>
  );
};

export default ActivitySearchResult;
