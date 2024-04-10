'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '~/components/ui/button';
import { api } from '~/trpc/client';

export default function TrainingSessionPage() {
  const session = useSession({ required: true });
  const { trainingSessionId } = useParams<{ trainingSessionId: string }>();
  const trainingSession = api.trainingSessions.getTrainingSession.useQuery(trainingSessionId);

  if (session.status === 'loading' || trainingSession.isPending) {
    return <p>Loading...</p>;
  }

  if (trainingSession.isError) {
    return <p>{trainingSession.error.message}</p>;
  }

  return (
    <div>
      <pre>{JSON.stringify(trainingSession.data, null, 2)}</pre>
      <Button asChild>
        <Link href={`/training/${trainingSessionId}/settings`}>Settings</Link>
      </Button>
    </div>
  );
}
