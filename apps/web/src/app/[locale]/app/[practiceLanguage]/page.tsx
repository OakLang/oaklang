import { useTranslations } from "next-intl";

import type { PracticeLanguageParams } from "~/types";
import { HydrateClient, trpc } from "~/trpc/server";
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
      <div className="container my-8 max-w-screen-xl">
        <div className="flex gap-4 p-4">
          <div className="flex-1"></div>
          <StartTrainingButton />
        </div>
        <div className="bg-border my-4 h-px"></div>

        <div>
          <div className="p-4">
            <p className="text-lg font-medium">{t("sessions")}</p>
          </div>
          <TrainingSessionList practiceLanguage={params.practiceLanguage} />
        </div>
      </div>
    </HydrateClient>
  );
}
