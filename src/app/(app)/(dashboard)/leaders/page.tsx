import TitleBar from '~/components/TitleBar';
import { APP_NAME } from '~/utils/constants';
import type { Metadata } from 'next';
import LeadersList from './_components/leaders-list';

export const metadata: Metadata = {
  title: `Leaders - ${APP_NAME}`,
};

export default function LeadersPage() {
  return (
    <>
      <TitleBar title="Leaders" />
      <LeadersList />
    </>
  );
}
