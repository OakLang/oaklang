import type { Metadata } from 'next';
import TitleBar from '~/components/TitleBar';
import { APP_NAME } from '~/utils/constants';
import GithubLogInCard from './_components/github-login-card';
import ConnectionsCard from './_components/connections-card';
import DeleteAccountCard from './_components/delete-account-card';
import UsernameCard from './_components/username-card';

export const metadata: Metadata = {
  title: `Settings - ${APP_NAME}`,
};

export default function SettingsPage() {
  return (
    <main>
      <TitleBar hideBackButton title="Settings" />
      <div className="space-y-4 p-4">
        <GithubLogInCard />
        <ConnectionsCard />
        <UsernameCard />
        <DeleteAccountCard />
      </div>
    </main>
  );
}
