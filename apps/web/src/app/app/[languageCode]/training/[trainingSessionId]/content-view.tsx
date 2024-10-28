"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useIsMutating } from "@tanstack/react-query";
import { getMutationKey } from "@trpc/react-query";
import { ChevronLeftIcon, Loader2Icon } from "lucide-react";

import type { TrainingSession } from "@acme/db/schema";

import type { TrainingSessionParams } from "~/types";
import RenderQueryResult from "~/components/RenderQueryResult";
import { SentenceView } from "~/components/SentenceView";
import ToolBar from "~/components/ToolBar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
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

const SessionComplete = ({
  onBack,
  trainingSession,
}: {
  trainingSession: TrainingSession;
  onBack: () => void;
}) => {
  const knownWordsQuery =
    api.trainingSessions.getAllKnownWordsFromSession.useQuery({
      trainingSessionId: trainingSession.id,
    });

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

              <RenderQueryResult query={knownWordsQuery}>
                {(query) => {
                  if (query.data.length === 0) {
                    return null;
                  }

                  return (
                    <div className="my-16 space-y-4">
                      <p className="text-lg font-medium">
                        You have added {query.data.length} known words
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {query.data.map((word) => (
                          <Badge key={word.id} variant="outline">
                            {word.word}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                }}
              </RenderQueryResult>
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
