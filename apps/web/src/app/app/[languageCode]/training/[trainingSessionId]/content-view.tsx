"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronLeftIcon, Loader2Icon } from "lucide-react";

import type { TrainingSession } from "@acme/db/schema";

import type { TrainingSessionParams } from "~/types";
import { SentenceView } from "~/components/SentenceView";
import ToolBar from "~/components/ToolBar";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export default function ContentView() {
  const [showComplitionPage, setShowComplitionPage] = useState(false);
  const { trainingSessionId } = useParams<TrainingSessionParams>();

  const utils = api.useUtils();
  const trainingSessionQuery = api.trainingSessions.getTrainingSession.useQuery(
    { trainingSessionId },
    {
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "idle" || status === "pending") {
          return 1000;
        }
        if (status === "success") {
          return 10000;
        }
        return false;
      },
    },
  );
  const sentencesQuery = api.sentences.getSentences.useQuery({
    trainingSessionId,
  });

  useEffect(() => {
    if (trainingSessionQuery.data?.status === "success") {
      void utils.sentences.getSentences.invalidate({ trainingSessionId });
    }
  }, [
    trainingSessionId,
    trainingSessionQuery.data?.status,
    utils.sentences.getSentences,
  ]);

  if (trainingSessionQuery.isError) {
    return <p>{trainingSessionQuery.error.message}</p>;
  }

  if (
    trainingSessionQuery.isPending ||
    trainingSessionQuery.data.status === "idle"
  ) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2Icon className="h-6 w-6 animate-spin" />
          <p className="text-muted-foreground text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (sentencesQuery.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2Icon className="h-6 w-6 animate-spin" />
          <p className="text-muted-foreground text-center">
            Loading Sentences...
          </p>
        </div>
      </div>
    );
  }

  if (sentencesQuery.isError) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground text-center">
            Setences Error: {sentencesQuery.error.message}
          </p>
        </div>
      </div>
    );
  }

  if (showComplitionPage) {
    return (
      <SessionComplete
        onBack={() => setShowComplitionPage(false)}
        trainingSession={trainingSessionQuery.data}
      />
    );
  }

  return (
    <SentenceView
      trainingSession={trainingSessionQuery.data}
      sentences={sentencesQuery.data}
      onComplete={() => setShowComplitionPage(true)}
    />
  );
}

const SessionComplete = ({
  onBack,
  trainingSession,
}: {
  trainingSession: TrainingSession;
  onBack: () => void;
}) => {
  return (
    <>
      <ToolBar trainingSession={trainingSession} />

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-1 gap-4 py-8 md:py-16">
          <div className="md:pl-2">
            <Button
              variant="ghost"
              className="text-muted-foreground h-full w-12"
              size="icon"
              onClick={onBack}
            >
              <ChevronLeftIcon className="h-8 w-8" />
            </Button>
          </div>

          <div className="flex flex-1 flex-col">
            <div className="mx-auto flex w-full max-w-screen-md flex-1 flex-col">
              <p className="text-2xl font-semibold">YAY! Session complete!</p>
            </div>
          </div>

          <div className="md:pr-2">
            <div className="h-full w-12"></div>
          </div>
        </div>
      </div>
    </>
  );
};
