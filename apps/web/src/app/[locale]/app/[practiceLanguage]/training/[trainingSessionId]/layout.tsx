"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";

import FullScreenLoader from "~/app/full-screen-loader";
import { Button } from "~/components/ui/button";
import { Link } from "~/i18n/routing";
import TrainingSessionStoreProvider from "~/providers/training-session-store-provider";
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
    <TrainingSessionStoreProvider trainingSession={trainingSessionQuery.data}>
      {children}
    </TrainingSessionStoreProvider>
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
