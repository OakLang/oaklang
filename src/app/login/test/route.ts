import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { User } from '~/server/schema';
import { loginUser } from '~/utils/server-auth';
import { BASE_URL, NODE_ENV } from '~/utils/constants';
import { createCSRFToken } from '~/utils/csrf';

export const GET = async () => {
  if (NODE_ENV !== 'development') {
    return new NextResponse('Not found', { status: 404 });
  }

  const githubId = Math.floor(Math.random() * 9999999);

  const user = (
    await db
      .insert(User)
      .values({
        githubId: githubId,
        githubUser: {
          avatar_url: '',
          created_at: new Date().toISOString(),
          events_url: '',
          followers: 0,
          followers_url: '',
          following: 0,
          following_url: '',
          gists_url: '',
          html_url: '',
          id: githubId,
          login: createCSRFToken(),
          node_id: '',
          organizations_url: '',
          received_events_url: '',
          repos_url: '',
          site_admin: false,
          starred_url: '',
          subscriptions_url: '',
          url: '',
        },
      })
      .returning()
  )[0];
  if (!user) {
    return new NextResponse('Not found', { status: 404 });
  }

  await loginUser(user, null, true);

  return NextResponse.redirect(new URL('/onboard', BASE_URL));
};
