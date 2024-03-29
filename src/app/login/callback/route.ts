import { and, eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { wonderfulFetch } from '~/integrations/utils';
import { db } from '~/server/db';
import { Integration, User } from '~/server/schema';
import { loginUser } from '~/utils/server-auth';
import {
  BASE_URL,
  CLAIM_USERNAME_COOKIE,
  GITHUB_LOGIN_APP_ID,
  GITHUB_LOGIN_REDIRECT_URI,
  GITHUB_LOGIN_SECRET,
  GITHUB_TOKEN_URL,
} from '~/utils/constants';
import { validateCSRFTokenCookie } from '~/utils/csrf';
import type { GitHubUser } from '~/utils/types';
import { isNonEmptyString, parseJSONObject, validateUsername } from '~/utils/validators';

const stateSchema = z.object({
  c: z.string(),
  n: z.string().optional().nullable(),
});

export const GET = async (req: NextRequest) => {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');

  if (!isNonEmptyString(code)) {
    return new NextResponse('Invalid OAuth code.', { status: 400 });
  }

  const s = stateSchema.safeParse(parseJSONObject(state));

  if (!s.success) {
    console.error(s.error.message);
    return new NextResponse('Invalid OAuth state.', { status: 400 });
  }

  if (!validateCSRFTokenCookie(req, s.data.c)) {
    return new NextResponse('Invalid CSRF token.', { status: 400 });
  }

  const response = await wonderfulFetch(GITHUB_TOKEN_URL, {
    body: JSON.stringify({
      client_id: GITHUB_LOGIN_APP_ID,
      client_secret: GITHUB_LOGIN_SECRET,
      code: code,
      redirect_uri: GITHUB_LOGIN_REDIRECT_URI,
    }),
    headers: {
      'User-Agent': 'github.com/wakatime/wonderful.dev',
    },
    method: 'POST',
  });

  if (response.status !== 200) {
    return new NextResponse('Invalid OAuth code.', { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const accessToken = (await response.json()).access_token as string;

  const url = 'https://api.github.com/user';
  const githubResponse = await wonderfulFetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `token ${accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'github.com/wakatime/wonderful.dev',
    },
  });

  if (githubResponse.status !== 200) {
    return new NextResponse('Invalid OAuth code.', { status: 400 });
  }

  const githubUser = parseJSONObject(await githubResponse.text()) as GitHubUser;
  const githubId = githubUser.id;

  let username: string | null = null;
  const form = validateUsername(cookies().get(CLAIM_USERNAME_COOKIE)?.value ?? '');
  if (!form.error) {
    username = form.data as string;
  }

  let isNewUser = false;
  let user = await db.query.User.findFirst({ where: and(eq(User.isActive, true), eq(User.githubId, githubId)) });
  if (!user) {
    const integration = await db.query.Integration.findFirst({
      where: and(eq(Integration.provider, 'github'), eq(Integration.providerAccountId, String(githubId))),
      with: {
        user: true,
      },
    });
    if (integration && integration.user.isActive) {
      user = integration.user;
    }
    if (!user) {
      user = (
        await db
          .insert(User)
          .values({
            githubFullName: githubUser.name,
            githubId: githubId,
            githubUser: githubUser,
            username: username,
          })
          .onConflictDoNothing()
          .returning()
      )[0];
      if (user?.id) {
        isNewUser = true;
      } else {
        user = await db.query.User.findFirst({ where: and(eq(User.isActive, true), eq(User.githubId, githubId)) });
        if (!user) {
          throw new Error('User not found.');
        }
      }
    }
  }

  await loginUser(user, username, isNewUser);

  cookies().delete(CLAIM_USERNAME_COOKIE);

  return NextResponse.redirect(new URL(s.data.n ?? '/onboard', BASE_URL));
};
