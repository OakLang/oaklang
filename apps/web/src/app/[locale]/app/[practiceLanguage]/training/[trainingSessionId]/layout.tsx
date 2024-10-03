"use client";

import type { ReactNode } from "react";

import FullScreenLoader from "~/components/FullScreenLoader";
import { Button } from "~/components/ui/button";
import { usePracticeLanguageCode } from "~/hooks/usePracticeLanguageCode";
import { useTrainingSessionId } from "~/hooks/useTrainingSessionId";
import { Link } from "~/i18n/routing";
import { api } from "~/trpc/react";

export default function TrainingLayout({ children }: { children: ReactNode }) {
  const trainingSessionId = useTrainingSessionId();
  const practiceLanguage = usePracticeLanguageCode();
  const trainingSessionQuery =
    api.trainingSessions.getTrainingSession.useQuery(trainingSessionId);

  if (trainingSessionQuery.isPending) {
    return <FullScreenLoader />;
  }

  if (
    trainingSessionQuery.isError ||
    trainingSessionQuery.data.languageCode !== practiceLanguage
  ) {
    return <NotFound />;
  }

  return children;
}

function NotFound() {
  return (
    <div>
      <p>Training Session Not Found!</p>
      <Button asChild>
        <Link href="/app">Dashboard</Link>
      </Button>
    </div>
  );
}
