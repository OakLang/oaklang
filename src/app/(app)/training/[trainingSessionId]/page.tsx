'use client';

import { ArrowRight } from 'lucide-react';
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
      <div>
        <Button asChild variant="link">
          <Link href="/home">Home</Link>
        </Button>
        <Button asChild variant="link">
          <Link href={`/training/${trainingSessionId}/settings`}>Settings</Link>
        </Button>
      </div>
      <div className="container space-y-8 px-4">
        {/* <InterlinearList /> */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline">Help!</Button>
          <Button variant="outline">100%!</Button>
          <Button>
            Next
            <ArrowRight className="-mr-1 ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
