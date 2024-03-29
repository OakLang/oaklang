import { and, eq, gt } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '~/server/db';
import { User, UserLoginToken } from '~/server/schema';
import { BASE_URL } from '~/utils/constants';
import { loginUser } from '~/utils/server-auth';

export const GET = async (req: NextRequest) => {
  const token = req.nextUrl.searchParams.get('token');
  const userId = req.nextUrl.searchParams.get('user');

  if (!token || !userId) {
    return new NextResponse('Not found', { status: 404 });
  }

  const user = await db.query.User.findFirst({ where: and(eq(User.isActive, true), eq(User.id, userId)) });
  if (!user) {
    return new NextResponse('Not found', { status: 404 });
  }

  const t = await db.query.UserLoginToken.findFirst({
    where: and(eq(UserLoginToken.id, token), eq(UserLoginToken.userId, user.id), gt(UserLoginToken.expiresAt, new Date())),
  });
  if (!t) {
    return new NextResponse('Not found', { status: 404 });
  }

  await loginUser(user, null, false);
  await db
    .update(UserLoginToken)
    .set({ usedCount: t.usedCount + 1 })
    .where(eq(UserLoginToken.id, t.id));

  return NextResponse.redirect(new URL('/home', BASE_URL));
};
