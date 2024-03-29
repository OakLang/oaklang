import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from '~/server/db';
import { User } from '~/server/schema';
import { getUser } from '~/utils/server-auth';
import { userToPublicUser } from '~/utils/backend';
import SuggestedList from './_list/suggested-list';
import TitleBar from '~/components/TitleBar';
import type { Metadata } from 'next';
import { APP_NAME } from '~/utils/constants';

type Props = {
  searchParams: {
    userId?: string;
  };
};

export const metadata: Metadata = {
  title: `Connect - ${APP_NAME}`,
};

export default async function ConnectPeoplePage({ searchParams }: Props) {
  const currentUser = await getUser();
  if (!currentUser) {
    const params = new URLSearchParams(searchParams);
    const currentUrl = `/connect-people?${params.toString()}`;
    const rParams = new URLSearchParams({ next: currentUrl });
    redirect(`/flow/login?${rParams.toString()}`);
  }

  let publicUser = await userToPublicUser(currentUser);

  if (searchParams.userId && searchParams.userId !== currentUser.id) {
    const user = await db.query.User.findFirst({ where: and(eq(User.isActive, true), eq(User.id, searchParams.userId)) });
    if (user) {
      publicUser = await userToPublicUser(user);
    }
  }

  return (
    <>
      <TitleBar title="Connect" />
      <div className="p-4">
        <h2 className="text-xl font-bold">{publicUser.id === currentUser.id ? 'Suggested for you' : `Similar to ${publicUser.name}`}</h2>
      </div>
      <SuggestedList user={publicUser} />
    </>
  );
}
