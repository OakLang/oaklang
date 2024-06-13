import { api } from "~/trpc/server";

export default async function TrainingSession({
  params,
}: {
  params: { trainingSessionId: string };
}) {
  const trainingSession = await api.trainingSessions.getTrainingSession({
    trainingSessionId: params.trainingSessionId,
  });
  return (
    <div>
      <pre>{JSON.stringify(trainingSession, null, 2)}</pre>
    </div>
  );
}
