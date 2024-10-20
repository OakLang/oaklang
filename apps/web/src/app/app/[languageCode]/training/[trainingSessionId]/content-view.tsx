"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronLeftIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import type { TrainingSession } from "@acme/db/schema";
import { Exercises } from "@acme/core/constants";

import type { TrainingSessionParams } from "~/types";
import { SentenceView } from "~/components/SentenceView";
import ToolBar from "~/components/ToolBar";
import { Button } from "~/components/ui/button";
import { useAppStore } from "~/store/app-store";
import { api } from "~/trpc/react";

export default function ContentView() {
  const [showComplitionPage, setShowComplitionPage] = useState(false);
  const [initialGenerateSentencesCalled, setInitialGenerateSentencesCalled] =
    useState(false);
  const { trainingSessionId } = useParams<TrainingSessionParams>();

  const exercise1PromptTemplate = useAppStore(
    (state) => state.exercise1PromptTemplate,
  );

  const utils = api.useUtils();
  const trainingSessionQuery = api.trainingSessions.getTrainingSession.useQuery(
    { trainingSessionId },
    {
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "idle" || status === "pending") {
          return 1000;
        }
        return false;
      },
    },
  );
  const sentencesQuery = api.sentences.getSentences.useQuery(
    { trainingSessionId },
    {
      refetchInterval: (query) => {
        const status = trainingSessionQuery.data?.status;
        const sentences = query.state.data;
        if (status === "success" && (!sentences || sentences.length === 0)) {
          return 500;
        }
        return false;
      },
    },
  );

  const generateSentencesMut = api.sentences.generateSentences.useMutation({
    onSuccess: (data, { trainingSessionId }) => {
      utils.sentences.getSentences.setData(
        { trainingSessionId },
        (sentences) => [...(sentences ?? []), ...data],
      );
    },
    onError: (error) => {
      toast("Failed to generate sentences", { description: error.message });
    },
  });

  useEffect(() => {
    if (
      !trainingSessionQuery.isSuccess ||
      !sentencesQuery.isSuccess ||
      trainingSessionQuery.data.exercise !== Exercises.exercise1
    ) {
      return;
    }

    if (
      !initialGenerateSentencesCalled &&
      sentencesQuery.data.length === 0 &&
      !generateSentencesMut.isPending
    ) {
      setInitialGenerateSentencesCalled(true);
      generateSentencesMut.mutate({
        trainingSessionId,
        exercise1PromptTemplate,
      });
    }
  }, [
    generateSentencesMut,
    initialGenerateSentencesCalled,
    sentencesQuery.data?.length,
    sentencesQuery.isSuccess,
    trainingSessionId,
    exercise1PromptTemplate,
    trainingSessionQuery.isSuccess,
    trainingSessionQuery.data?.exercise,
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

  if (trainingSessionQuery.data.status === "pending") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2Icon className="h-6 w-6 animate-spin" />
          <p className="text-muted-foreground text-center">
            Generating Sentences...
          </p>
        </div>
      </div>
    );
  }

  if (trainingSessionQuery.data.status === "canceled") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground text-center">
            Generation Canceled
          </p>
        </div>
      </div>
    );
  }

  if (trainingSessionQuery.data.status === "error") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground text-center">
            Error while generating Sentences
          </p>
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
