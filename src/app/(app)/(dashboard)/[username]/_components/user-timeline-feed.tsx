'use client';

import { LuLoader2 } from 'react-icons/lu';
import TimelineFeedItem from 'src/components/TimelineFeedItem';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { api } from '~/trpc/client';

export default function UserTimelineFeed({ userId }: { userId: string }) {
  const { ref, inView } = useInView();
  const timelineQuery = api.timeline.getProfileTimeline.useInfiniteQuery(
    { userId },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );
  const haveNextPage = !!timelineQuery.data?.pages.at(-1)?.nextCursor;

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
    return null;
  }

  return (
    <div className="space-y-4 p-4">
      {timelineQuery.data.pages.map((page) => page.items.map((item) => <TimelineFeedItem feedItem={item} key={item.id} />))}
      {haveNextPage ? (
        <div className="flex h-80 items-center justify-center" ref={ref}>
          <LuLoader2 className="animate-spin" size={24} />
        </div>
      ) : null}
    </div>
  );
}
