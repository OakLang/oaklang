import { CSRF_COOKIE, CSRF_PROTECTED_METHODS, CSRF_TOKEN_HEADER } from './utils/constants';
import { setCSRFTokenCookie, validateCSRFTokenCookie } from './utils/csrf';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest): NextResponse | void {
  // validate csrf token on modifying requests
  const method = req.method.toUpperCase();
  if (CSRF_PROTECTED_METHODS.includes(method)) {
    const token = req.headers.get(CSRF_TOKEN_HEADER);
    if (!validateCSRFTokenCookie(req, token)) {
      return new NextResponse('Invalid CSRF Token', {
        headers: { 'content-type': 'text/plain' },
        status: 403,
      });
    }
  }

  if (req.nextUrl.pathname.startsWith('/api/')) {
    return;
  }
  if (req.nextUrl.pathname.startsWith('/_next/')) {
    return;
  }
  if (req.nextUrl.pathname === '/favicon.ico') {
    return;
  }

  // run the original request
  const res = NextResponse.next();

  // set csrf token cookie if not already set
  if (!req.cookies.get(CSRF_COOKIE)) {
    setCSRFTokenCookie(req, res);
  }

  return res;
}
