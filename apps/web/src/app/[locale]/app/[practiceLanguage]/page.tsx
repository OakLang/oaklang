import type { PracticeLanguageParams } from "~/types";
import { HydrateClient, trpc } from "~/trpc/server";
import TrainingSessionList from "./training-session-list";

export default function AppPage({
  params,
}: Readonly<{
  params: PracticeLanguageParams;
}>) {
  void trpc.trainingSessions.getTrainingSessions.prefetch({
    languageCode: params.practiceLanguage,
  });

  return (
    <HydrateClient>
      <TrainingSessionList />
    </HydrateClient>
  );
}
