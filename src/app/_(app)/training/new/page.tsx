'use client';

import { useRouter } from 'next/navigation';
import CreateOrUpdateTrainingSessionForm from '~/components/CreateOrUpdateTrainingSessionForm';

export default function CreateTrainingSessionPage() {
  const router = useRouter();

  return (
    <div className="container my-16 max-w-screen-sm">
      <h1 className="text-3xl font-bold">New Training Session</h1>
      <CreateOrUpdateTrainingSessionForm
        onSuccess={(trainingSession) => {
          router.push(`/training/${trainingSession.id}`);
        }}
      />
    </div>
  );
}
