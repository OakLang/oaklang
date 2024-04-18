'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from '~/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  const session = useSession();

  if (session.status === 'loading') {
    return <p>Loading...</p>;
  }

  return (
    <div>
      {session.status === 'authenticated' ? (
        <>
          <p>Welcome, {session.data.user.name ?? 'there'} 👋</p>
          <Button asChild>
            <Link href="/training/new">Start Training</Link>
          </Button>
          <Button onClick={() => signOut()} variant="destructive">
            Sign Out
          </Button>
        </>
      ) : (
        <>
          <p>Welcome to Oaklang</p>
          <Button onClick={() => signIn()}>Sign In</Button>
        </>
      )}
    </div>
  );
}
