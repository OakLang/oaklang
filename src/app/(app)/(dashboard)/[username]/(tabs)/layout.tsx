import type { ReactNode } from 'react';
import TitleBar from '~/components/TitleBar';
import FollowerFollowingTabs from './_components/follower-following-tabs';
import { getUserByUsername } from '~/utils/server-auth';
import { userToPublicUser } from '~/utils/backend';
import { notFound } from 'next/navigation';

type Props = {
  children: ReactNode;
  params: { username: string };
};

export default async function UserTabsLayout({ children, params }: Props) {
  const user = await getUserByUsername(params.username);
  if (!user || !user.isActive) {
    notFound();
  }
  const publicUser = await userToPublicUser(user);
  return (
    <main>
      <TitleBar
        bottom={<FollowerFollowingTabs user={publicUser} />}
        title={
          <div className="flex-1">
            <p className="line-clamp-1 text-lg font-bold leading-6">{publicUser.name ?? user.username}</p>
            <p className="line-clamp-1 text-sm leading-4 text-muted-foreground">@{user.username}</p>
          </div>
        }
      />
      {children}
    </main>
  );
}
