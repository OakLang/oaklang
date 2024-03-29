import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getUserByUsername } from '~/utils/server-auth';
import { userToPublicUser } from '~/utils/backend';
import { APP_NAME } from '~/utils/constants';
import FollowingList from './_components/following-list';

type Props = {
  params: {
    username: string;
  };
};

export const generateMetadata = async ({ params }: Props) => {
  const user = await getUserByUsername(params.username);
  if (!user || !user.isActive) {
    return {};
  }

  const publicUser = await userToPublicUser(user);

  return {
    title: `People followed by ${publicUser.name ?? user.username} (@${user.username}) - ${APP_NAME}`,
  } satisfies Metadata;
};

export default async function FollowersPage({ params }: Props) {
  const user = await getUserByUsername(params.username);
  if (!user || !user.isActive) {
    notFound();
  }

  return <FollowingList userId={user.id} />;
}
