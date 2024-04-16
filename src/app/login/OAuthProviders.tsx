'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Button } from '~/components/ui/button';

export default function OAuthProviders() {
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(() => searchParams.get('callbackUrl') ?? '/', [searchParams]);

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={() => signIn('google', { callbackUrl })} variant="outline">
        Log in with Google
      </Button>
    </div>
  );
}
