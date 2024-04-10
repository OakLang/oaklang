'use client';

import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { api } from '~/trpc/client';
import UpdateTrainingSessionForm from './UpdateTrainingSessionForm';

export default function TrainingSessionSettingsPage() {
  const session = useSession({ required: true });
  const { trainingSessionId } = useParams<{ trainingSessionId: string }>();
  const trainingSession = api.trainingSessions.getTrainingSession.useQuery(trainingSessionId);

  if (session.status === 'loading' || trainingSession.isPending) {
    return <p>Loading...</p>;
  }

  if (trainingSession.isError) {
    return <p>{trainingSession.error.message}</p>;
  }

  return <UpdateTrainingSessionForm trainingSession={trainingSession.data} />;
}
