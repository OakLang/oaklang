'use client';

import Link from 'next/link';
import React from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { APP_NAME } from '~/utils/constants';

export default function LogInForm({ next }: { next?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Log In to {APP_NAME}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link
            className="w-full"
            href={{
              pathname: '/login',
              query: {
                next: next ?? '/home',
              },
            }}
          >
            Log in with Github
          </Link>
        </Button>
        <Button className="mt-2 w-full" variant="link">
          <Link href="/">Back to Home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
