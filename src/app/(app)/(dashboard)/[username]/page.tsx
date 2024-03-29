import { count, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { RedirectType, notFound, redirect } from 'next/navigation';
import pluralize from 'pluralize';
import React from 'react';
import TitleBar from '~/components/TitleBar';
import { formatNumber } from '~/utils';
import { db } from '~/server/db';
import { GlobalTimelineItem } from '~/server/schema';
import { doesUserFollowUser, userToPublicUser } from '~/utils/backend';
import { APP_NAME } from '~/utils/constants';
import ProfileDetails from './_components/profile-details';
import UserTimelineFeed from './_components/user-timeline-feed';
import { getUser, getUserByUsername } from '~/utils/server-auth';

type Props = {
  params: {
    username: string;
  };
  searchParams: {
    follow?: string;
  };
};

export const generateMetadata = async ({ params }: Props) => {
  const user = await getUserByUsername(params.username, {
    profileDefaults: true,
  });
  if (!user || !user.isActive) {
    return {};
  }
  const publicUser = await userToPublicUser(user);
  return {
    openGraph: {
      images: [publicUser.avatarUrl],
    },
    title: publicUser.username
      ? `${publicUser.name ?? publicUser.username} (@${publicUser.username}) - ${APP_NAME}`
      : `${publicUser.id} - ${APP_NAME}`,
  } satisfies Metadata;
};

export default async function UserProfilePage({ params, searchParams }: Props) {
  const currentUser = await getUser();
  if (params.username === 'me') {
    if (currentUser) {
      redirect(`/${currentUser.username ?? currentUser.id}`, RedirectType.replace);
    } else {
      notFound();
    }
  }

  const user = await getUserByUsername(params.username, {
    profileDefaults: true,
  });
  if (!user || !user.isActive) {
    notFound();
  }
  const profile = await userToPublicUser(user);

  const totalActivities = await db
    .select({ count: count() })
    .from(GlobalTimelineItem)
    .where(eq(GlobalTimelineItem.userId, user.id))
    .then((results) => results.at(0)?.count ?? 0);

  const isMyProfile = !!currentUser && currentUser.id === profile.id;

  let isFollowing = false;

  if (currentUser && !isMyProfile) {
    isFollowing = await doesUserFollowUser(profile.id, currentUser.id);
  }

  return (
    <main>
      <TitleBar
        title={
          <div>
            <p className="line-clamp-1 text-lg font-bold leading-6">{profile.name ?? profile.username ?? profile.id}</p>
            <p className="line-clamp-1 text-sm leading-4 text-muted-foreground">
              {formatNumber(totalActivities)} {pluralize('activity', totalActivities)}
            </p>
          </div>
        }
      />
      <ProfileDetails
        follow={!isMyProfile && searchParams.follow === 'true'}
        isFollowing={isFollowing}
        isMyProfile={isMyProfile}
        profile={profile}
        username={params.username}
      />
      <UserTimelineFeed userId={profile.id} />
    </main>
  );
}
