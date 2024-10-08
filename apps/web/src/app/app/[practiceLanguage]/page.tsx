import { useTranslations } from "next-intl";

import type { PracticeLanguageParams } from "~/types";
import { HydrateClient, trpc } from "~/trpc/server";
import GrowButton from "./grow-button";
import StartTrainingButton from "./start-training-button";
import TrainingSessionList from "./training-session-list";

export default function AppPage({
  params,
}: Readonly<{
  params: PracticeLanguageParams;
}>) {
  const t = useTranslations("App");
  void trpc.trainingSessions.getTrainingSessions.prefetch({
    languageCode: params.practiceLanguage,
  });

  return (
    <HydrateClient>
      <div className="container my-8 max-w-screen-xl space-y-8 px-4">
        <div className="flex items-center gap-4">
          <p className="text-xl font-semibold">{t("sessions")}</p>
          <div className="flex flex-1 items-center justify-end gap-2">
            <GrowButton />
            <StartTrainingButton />
          </div>
        </div>
        <TrainingSessionList practiceLanguage={params.practiceLanguage} />
      </div>
    </HydrateClient>
  );
}
