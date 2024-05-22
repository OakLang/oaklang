'use client';

import { signOut, useSession } from 'next-auth/react';
import type { ReactNode } from 'react';
import { Button } from '~/components/ui/button';

export default function AppLayout({ children }: { children: ReactNode }) {
  const session = useSession({ required: true });

  if (session.status === 'loading') {
    return <p>Loading...</p>;
  }
  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b px-4">
        <div className="flex-1" />
        <p>{session.data.user.email}</p>
        <Button onClick={() => signOut()} variant="destructive">
          Sign Out
        </Button>
      </header>
      {children}
    </>
  );
}
