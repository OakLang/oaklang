import { CSRF_COOKIE, CSRF_EXPIRES, NODE_ENV } from './constants';
import type { IncomingMessage, ServerResponse } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import { getCookie, setCookie } from 'cookies-next';

import type { NextApiRequestCookies } from 'next/dist/server/api-utils';

// we can't use crypto.randomBytes
// https://nextjs.org/docs/messages/node-module-in-edge-runtime
export function createCSRFToken(length = 80): string {
  const i2hex = (i: number) => ('0' + i.toString(16)).slice(-2);
  const r = (a: string, i: number): string => a + i2hex(i);
  const bytes = crypto.getRandomValues(new Uint8Array(length / 2));
  return Array.from(bytes).reduce(r, '');
}

export function setCSRFTokenCookie(
  req:
    | NextRequest
    | NextApiRequest
    | (IncomingMessage & {
        cookies: NextApiRequestCookies;
      }),
  res: NextResponse | NextApiResponse | ServerResponse<IncomingMessage>,
  token?: string,
): string {
  if (!token) {
    token = createCSRFToken();
  }
  if (res instanceof NextResponse) {
    res.cookies.set({
      maxAge: CSRF_EXPIRES,
      name: CSRF_COOKIE,
      sameSite: 'lax',
      secure: NODE_ENV === 'production',
      value: token,
    });
    return token;
  }
  if (req instanceof NextRequest) {
    throw 'This should never happen';
  }
  setCookie(CSRF_COOKIE, token, {
    maxAge: CSRF_EXPIRES,
    req,
    res,
    sameSite: 'lax',
    secure: NODE_ENV === 'production',
  });
  return token;
}

export function getCSRFTokenCookie(
  req:
    | NextRequest
    | NextApiRequest
    | (IncomingMessage & {
        cookies: NextApiRequestCookies;
      }),
): string | null {
  if (req instanceof NextRequest) {
    return req.cookies.get(CSRF_COOKIE)?.value ?? null;
  }
  const cookieToken = getCookie(CSRF_COOKIE, { req });
  if (!cookieToken) {
    return null;
  }
  return cookieToken;
}

export function validateCSRFTokenCookie(
  req:
    | NextRequest
    | NextApiRequest
    | (IncomingMessage & {
        cookies: NextApiRequestCookies;
      }),
  token: string | null,
): boolean {
  if (!token) {
    return false;
  }
  const cookieToken = getCSRFTokenCookie(req);
  if (!cookieToken) {
    return false;
  }
  if (cookieToken.length != token.length) {
    return false;
  }
  return token === cookieToken; // TODO: implement web-safe constant-time comparison using double hmac verification
}
