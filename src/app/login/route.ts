import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  CSRF_COOKIE,
  CSRF_EXPIRES,
  GITHUB_AUTHORIZE_URL,
  GITHUB_LOGIN_APP_ID,
  GITHUB_LOGIN_REDIRECT_URI,
  NODE_ENV,
} from '~/utils/constants';
import { createCSRFToken } from '~/utils/csrf';
import type { OAuthLoginState } from '~/utils/types';
import { makeUrlSafe, validateUsername } from '~/utils/validators';

export const GET = (req: NextRequest) => {
  const username = req.nextUrl.searchParams.get('username');
  const next = req.nextUrl.searchParams.get('next');
  let nextUrl = '/onboard';
  if (typeof username === 'string' && !validateUsername(username).error) {
    nextUrl = `/signup?username=${username}`;
  } else if (typeof next === 'string') {
    nextUrl = makeUrlSafe(next) ?? nextUrl;
  }
  const token = createCSRFToken();
  cookies().set({
    maxAge: CSRF_EXPIRES,
    name: CSRF_COOKIE,
    sameSite: 'lax',
    secure: NODE_ENV === 'production',
    value: token,
  });
  const state: OAuthLoginState = { c: token, n: nextUrl };

  const params = new URLSearchParams({
    client_id: GITHUB_LOGIN_APP_ID!,
    redirect_uri: GITHUB_LOGIN_REDIRECT_URI,
    scope: '',
    state: btoa(JSON.stringify(state)),
  });
  const redirectUrl = `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
  return NextResponse.redirect(redirectUrl);
};
