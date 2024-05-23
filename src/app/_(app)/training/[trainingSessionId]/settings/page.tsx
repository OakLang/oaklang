'use client';

import { api } from '~/trpc/client';
import CreateOrUpdateTrainingSessionForm from '~/components/CreateOrUpdateTrainingSessionForm';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TrainingSessionSettingsPage() {
  const { trainingSessionId } = useParams<{ trainingSessionId: string }>();
  const trainingSessionQuery = api.trainingSessions.getTrainingSession.useQuery(trainingSessionId);
  const utils = api.useUtils();

  if (trainingSessionQuery.isPending) {
    return <p>Loading...</p>;
  }

  if (trainingSessionQuery.isError) {
    return <p>{trainingSessionQuery.error.message}</p>;
  }

  return (
    <div className="container my-16 max-w-screen-sm">
      <Link className="mb-4 flex items-center gap-1 hover:underline" href={`/training/${trainingSessionId}`}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <h1 className="text-3xl font-bold">Update Training Session</h1>
      <CreateOrUpdateTrainingSessionForm
        onSuccess={(trainingSession) => {
          toast('Session updated');
          utils.trainingSessions.getTrainingSession.setData(trainingSession.id, trainingSession);
        }}
        update={trainingSessionQuery.data}
      />
    </div>
  );
}
