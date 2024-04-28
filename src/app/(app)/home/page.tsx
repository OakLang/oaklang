'use client';

import { formatDistanceToNow } from 'date-fns';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '~/components/ui/button';
import { api } from '~/trpc/client';

export default function HomePage() {
  const session = useSession({ required: true });
  const trainingSessionsQuery = api.trainingSessions.getCurrentUserTrainingSessions.useQuery();

  if (session.status === 'loading') {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <div>
        <p>Welcome, {session.data.user.name ?? 'there'} 👋</p>
        <Button asChild>
          <Link href="/training/new">Start Training</Link>
        </Button>
        <Button onClick={() => signOut()} variant="destructive">
          Sign Out
        </Button>
      </div>

      <div>
        <p>Training Sessions</p>
        {trainingSessionsQuery.isPending ? (
          <p>Loading...</p>
        ) : trainingSessionsQuery.isError ? (
          <p>{trainingSessionsQuery.error.message}</p>
        ) : (
          <div>
            {trainingSessionsQuery.data.map((item) => (
              <Link className="flex flex-col border" href={`/training/${item.id}`} key={item.id}>
                <p>{item.id}</p>
                <p>Created {formatDistanceToNow(item.createdAt, { addSuffix: true })}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
