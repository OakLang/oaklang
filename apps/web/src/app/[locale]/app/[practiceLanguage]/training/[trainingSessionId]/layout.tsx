"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";

import FullScreenLoader from "~/app/full-screen-loader";
import { Button } from "~/components/ui/button";
import { Link } from "~/i18n/routing";
import TrainingSessionProvider from "~/providers/TrainingSessionProvider";
import { api } from "~/trpc/react";

export default function TrainingLayout({ children }: { children: ReactNode }) {
  const { practiceLanguage, trainingSessionId } = useParams<{
    trainingSessionId: string;
    practiceLanguage: string;
  }>();
  const trainingSessionQuery = api.trainingSessions.getTrainingSession.useQuery(
    { trainingSessionId },
  );

  if (trainingSessionQuery.isPending) {
    return <FullScreenLoader />;
  }

  if (
    trainingSessionQuery.isError ||
    trainingSessionQuery.data.languageCode !== practiceLanguage
  ) {
    return <NotFound />;
  }

  return (
    <TrainingSessionProvider trainingSession={trainingSessionQuery.data}>
      {children}
    </TrainingSessionProvider>
  );
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
