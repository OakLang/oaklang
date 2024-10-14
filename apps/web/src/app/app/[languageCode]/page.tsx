import type { LanguageCodeParams } from "~/types";
import { HydrateClient, trpc } from "~/trpc/server";
import AddButton from "./add-button";
import TrainingSessionList from "./training-session-list";

export default function AppPage({
  params: { languageCode },
}: Readonly<{
  params: LanguageCodeParams;
}>) {
  void trpc.trainingSessions.getTrainingSessions.prefetch({
    languageCode,
  });

  return (
    <HydrateClient>
      <div className="container my-8 max-w-screen-xl space-y-8 px-4 md:px-8">
        <div className="flex items-center gap-4">
          <div className="flex flex-1 items-center justify-end gap-2">
            <AddButton />
          </div>
        </div>
        <TrainingSessionList practiceLanguage={languageCode} />
      </div>
    </HydrateClient>
  );
}
