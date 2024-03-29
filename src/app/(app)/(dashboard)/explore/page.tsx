import TimelineFilterButton from '~/components/TimelineFilterButton';
import ExploreTimelineFeed from './_components/explore-timeline-feed';
import SearchForm from '~/components/SearchForm';
import { APP_NAME } from '~/utils/constants';
import type { Metadata } from 'next';
import TitleBar from '~/components/TitleBar';

export const metadata: Metadata = {
  title: `Explore - ${APP_NAME}`,
};

export default function ExplorePage() {
  return (
    <main>
      <TitleBar hideBackButton title={<SearchForm />} trailing={<TimelineFilterButton />} />
      <ExploreTimelineFeed />
    </main>
  );
}
