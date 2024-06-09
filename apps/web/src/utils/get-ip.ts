import type { NextRequest } from 'next/server';

export const getIPFromReq = (request: NextRequest) => {
  return request.ip ?? request.headers.get('X-Forwarded-For');
};
