import { createContext, memo, useCallback } from "react";

import type { Sentence } from "@acme/db/schema";

import type { RouterOutputs } from "~/trpc/react";
import { useIntersectionObserver } from "~/hooks/useIntersectionObserver";
import { api } from "~/trpc/react";
import InterlinearLineWordColumn from "./InterlinearLineWordColumn";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export const SentenceContext = createContext<{
  sentence: RouterOutputs["sentences"]["getSentence"];
} | null>(null);

export default function InterlinearLineSentence({
  sentence,
}: {
  sentence: Sentence;
}) {
  const utils = api.useUtils();
  const sentenceQuery = api.sentences.getSentence.useQuery(
    { sentenceId: sentence.id },
    {
      refetchInterval: (query) => {
        const status = query.state.data?.interlinearLineGenerationStatus;
        if (status === "idle" || status === "pending") {
          return 1000;
        }
        return false;
      },
    },
  );
  const regenerateSentenceInterlinearLines =
    api.sentences.regenerateSentenceInterlinearLines.useMutation({
      onSuccess: (_, vars) => {
        void utils.sentences.getSentence.invalidate({
          sentenceId: vars.sentenceId,
        });
      },
    });

  if (sentenceQuery.isError) {
    return <p>{sentenceQuery.error.message}</p>;
  }

  if (
    sentenceQuery.isPending ||
    sentenceQuery.data.interlinearLineGenerationStatus === "idle" ||
    sentenceQuery.data.interlinearLineGenerationStatus === "pending"
  ) {
    return <SentenceLoader />;
  }

  if (sentenceQuery.data.interlinearLineGenerationStatus === "canceled") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <p className="text-muted-foreground text-center">
          Interlinear Lines generation canceled
        </p>
        <Button
          onClick={() =>
            regenerateSentenceInterlinearLines.mutate({
              sentenceId: sentenceQuery.data.id,
            })
          }
          disabled={regenerateSentenceInterlinearLines.isPending}
          className="pointer-events-auto"
        >
          Regenerate
        </Button>
      </div>
    );
  }

  if (sentenceQuery.data.interlinearLineGenerationStatus === "failed") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <p className="text-muted-foreground text-center">
          Interlinear Lines generation failed
        </p>
        <Button
          onClick={() =>
            regenerateSentenceInterlinearLines.mutate({
              sentenceId: sentenceQuery.data.id,
            })
          }
          disabled={regenerateSentenceInterlinearLines.isPending}
          className="pointer-events-auto"
        >
          Regenerate
        </Button>
      </div>
    );
  }

  return (
    <SentenceContext.Provider value={{ sentence: sentenceQuery.data }}>
      <RenderSentence sentence={sentenceQuery.data} />
    </SentenceContext.Provider>
  );
}

function RenderSentence({
  sentence,
}: {
  sentence: RouterOutputs["sentences"]["getSentence"];
}) {
  const utils = api.useUtils();

  const markSentencesCompletedMut =
    api.sentences.markSentenceComplete.useMutation({
      onSuccess: (updatedSentence) => {
        utils.sentences.getSentences.setData(
          { trainingSessionId: updatedSentence.trainingSessionId },
          (sentences) =>
            (sentences ?? []).map((sentence) =>
              sentence.id === updatedSentence.id ? updatedSentence : sentence,
            ),
        );
      },
    });

  const onIntersect = useCallback(() => {
    if (!sentence.completedAt) {
      markSentencesCompletedMut.mutate({
        sentenceId: sentence.id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentence.id, sentence.completedAt]);

  const ref = useIntersectionObserver({
    onIntersect,
  });

  return (
    <div ref={ref}>
      {sentence.words.map((word) => (
        <InterlinearLineWordColumn
          key={`${word.word.id}-${word.index}`}
          word={word}
        />
      ))}
    </div>
  );
}

const SentenceLoader = memo(() => {
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();

  return Array.from({ length: 5 }).map((_, i) => (
    <div className="mb-16 mr-4 inline-flex flex-col items-center gap-2" key={i}>
      {userSettingsQuery.data?.interlinearLines.map((line) => (
        <Skeleton
          className="inline"
          style={{
            height: line.style.fontSize,
            width:
              (Math.random() * (40 - 10) + 40) * (line.style.fontSize / 16),
          }}
          key={line.id}
        />
      ))}
    </div>
  ));
});
