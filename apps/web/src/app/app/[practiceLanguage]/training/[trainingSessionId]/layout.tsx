import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { getTrainingSession } from "~/app/utils";
import TrainingSessionProvider from "~/providers/TrainingSessionProvider";

export default async function TrainingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { trainingSessionId: string; practiceLanguage: string };
}) {
  try {
    const trainingSession = await getTrainingSession({
      trainingSessionId: params.trainingSessionId,
    });

    if (trainingSession.languageCode !== params.practiceLanguage) {
      notFound();
    }

    return (
      <TrainingSessionProvider trainingSession={trainingSession}>
        {children}
      </TrainingSessionProvider>
    );
  } catch (error) {
    notFound();
  }
}
