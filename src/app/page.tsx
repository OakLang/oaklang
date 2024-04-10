'use client';

import { Loader2 } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '~/components/ui/button';
import { api } from '~/trpc/client';
import type { CreateTrainingSessionInput } from '~/utils/validators';
import { toast } from 'sonner';

const defaultSessionInput: CreateTrainingSessionInput = {
  language: 'en',
  numberOfTimesToRepeat: 5,
  numberOfTimesToTrain: 5,
  numberOfWordsToTrain: 5,
  percentKnown: 20,
  relatedPrecursor: false,
};

export default function HomePage() {
  const session = useSession();
  const router = useRouter();
  const createSessionMut = api.trainingSessions.createTrainingSession.useMutation({
    onError: (error) => {
      toast('Failed to create Training Session', { description: error.message });
    },
    onSuccess: (trainingSession) => {
      router.push(`/training/${trainingSession.id}`);
    },
  });

  if (session.status === 'loading') {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <pre>{JSON.stringify(session, null, 2)}</pre>
      {session.status === 'authenticated' ? (
        <>
          <Button
            disabled={createSessionMut.isPending || createSessionMut.isSuccess}
            onClick={() => createSessionMut.mutate(defaultSessionInput)}
          >
            {createSessionMut.isPending || createSessionMut.isSuccess ? <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" /> : null}
            Start Training
          </Button>
          <Button onClick={() => signOut()} variant="destructive">
            Sign Out
          </Button>
        </>
      ) : (
        <Button onClick={() => signIn()}>Sign In</Button>
      )}
    </div>
  );
}
