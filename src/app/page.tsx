'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from '~/components/ui/button';

export default function HomePage() {
  const session = useSession();

  if (session.status === 'loading') {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <pre>{JSON.stringify(session, null, 2)}</pre>
      {session.status === 'authenticated' ? (
        <Button onClick={() => signOut()} variant="destructive">
          Sign Out
        </Button>
      ) : (
        <Button onClick={() => signIn()}>Sign In</Button>
      )}
    </div>
  );
}
