import { auth } from '~/lib/auth';
import { db } from '~/lib/db';
import type { NextRequest } from 'next/server';

interface CreateContextProps {
  req: NextRequest;
}

export const createContext = async ({ req }: CreateContextProps) => {
  const session = await auth();
  return {
    db,
    req,
    session,
  };
};

export type Context = typeof createContext;
