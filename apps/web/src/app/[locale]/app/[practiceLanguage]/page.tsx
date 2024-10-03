import { HydrateClient, trpc } from "~/trpc/server";
import TrainingSessionList from "./training-session-list";

export default function AppPage({
  params,
}: {
  params: { practiceLanguage: string };
}) {
  void trpc.trainingSessions.getTrainingSessions.prefetch({
    languageCode: params.practiceLanguage,
  });

  return (
    <HydrateClient>
      <TrainingSessionList />
    </HydrateClient>
  );
}
