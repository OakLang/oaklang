'use client';

import { useEffect, useMemo, useState } from 'react';
import { LuLoader2 } from 'react-icons/lu';
import { useInView } from 'react-intersection-observer';
import TimelineFeedItem from '~/components/TimelineFeedItem';
import { useTimelineFilterOptions } from '~/stores/timeline-filter-options-store';
import { api } from '~/trpc/client';

export default function ExploreTimelineFeed() {
  const filter = useTimelineFilterOptions();
  const [before, _] = useState(new Date());
  const { ref, inView } = useInView();
  const timelineQuery = api.timeline.getExploreTimelineFeed.useInfiniteQuery(
    { before: before.toISOString(), filter },
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
        <p className="text-muted-foreground">No activity to show</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 p-4">
        {timelineQuery.data.pages.map((page) => page.items.map((item) => <TimelineFeedItem feedItem={item} key={item.id} />))}
      </div>
      {haveNextPage ? (
        <div className="flex h-80 items-center justify-center" ref={ref}>
          <LuLoader2 className="animate-spin" size={24} />
        </div>
      ) : null}
    </>
  );
}
