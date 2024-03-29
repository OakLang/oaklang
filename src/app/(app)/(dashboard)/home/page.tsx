import TitleBar from '~/components/TitleBar';
import TimelineFilterButton from '~/components/TimelineFilterButton';
import HomeTimelineFeed from './_components/home-timeline-feed';
import type { Metadata } from 'next';
import { APP_NAME } from '~/utils/constants';

export const metadata: Metadata = {
  title: `Home - ${APP_NAME}`,
};

export default function HomePage() {
  return (
    <main>
      <TitleBar hideBackButton title="Home" trailing={<TimelineFilterButton />} />
      <HomeTimelineFeed />
    </main>
  );
}
