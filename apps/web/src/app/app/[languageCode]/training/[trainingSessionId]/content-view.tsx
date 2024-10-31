"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useIsMutating } from "@tanstack/react-query";
import { getMutationKey } from "@trpc/react-query";
import { Loader2Icon } from "lucide-react";

import type { TrainingSessionParams } from "~/types";
import { SentenceView } from "~/components/SentenceView";
import { SessionComplete } from "~/components/SessionComplete";
import { api } from "~/trpc/react";

export default function ContentView() {
  const [showComplitionPage, setShowComplitionPage] = useState(false);
  const { trainingSessionId } = useParams<TrainingSessionParams>();

  const utils = api.useUtils();

  const isChangingIndex = useIsMutating({
    mutationKey: getMutationKey(api.trainingSessions.changeSentenceIndex),
  });

  const trainingSessionQuery = api.trainingSessions.getTrainingSession.useQuery(
    { trainingSessionId },
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

  useEffect(() => {
    if (isChangingIndex > 0) {
      return;
    }

    let timeout: NodeJS.Timeout | null = null;
    if (
      trainingSessionQuery.isSuccess &&
      (trainingSessionQuery.data.status === "idle" ||
        trainingSessionQuery.data.status === "pending")
    ) {
      timeout = setInterval(() => {
        void utils.trainingSessions.getTrainingSession.invalidate({
          trainingSessionId,
        });
      }, 1000);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [
    trainingSessionId,
    trainingSessionQuery.data?.status,
    trainingSessionQuery.isSuccess,
    utils.trainingSessions.getTrainingSession,
    isChangingIndex,
  ]);

  if (trainingSessionQuery.isError) {
    return <p>{trainingSessionQuery.error.message}</p>;
  }

  if (trainingSessionQuery.isPending) {
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
