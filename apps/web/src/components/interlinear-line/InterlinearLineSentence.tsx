import { createContext, memo, useCallback, useRef } from "react";

import type { Sentence } from "@acme/db/schema";

import type { RouterOutputs } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useIntersectionObserver } from "~/hooks/useIntersectionObserver";
import useOnScreen from "~/hooks/useOnScreen";
import { useUserSettings } from "~/providers/user-settings-provider";
import { useAppStore } from "~/store/app-store";
import { api } from "~/trpc/react";
import InterlinearLineWordColumn from "./InterlinearLineWordColumn";

export const SentenceContext = createContext<{
  sentence: RouterOutputs["sentences"]["getSentence"];
} | null>(null);

export default function InterlinearLineSentence({
  sentence,
}: {
  sentence: Sentence;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useOnScreen(ref);
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
      enabled: inView,
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

  return (
    <div ref={ref}>
      {sentenceQuery.isError ? (
        <p>{sentenceQuery.error.message}</p>
      ) : sentenceQuery.isPending ||
        sentenceQuery.data.interlinearLineGenerationStatus === "idle" ||
        sentenceQuery.data.interlinearLineGenerationStatus === "pending" ? (
        <SentenceLoader />
      ) : sentenceQuery.data.interlinearLineGenerationStatus === "canceled" ? (
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
      ) : sentenceQuery.data.interlinearLineGenerationStatus === "failed" ? (
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
      ) : (
        <SentenceContext.Provider value={{ sentence: sentenceQuery.data }}>
          <RenderSentence sentence={sentenceQuery.data} />
        </SentenceContext.Provider>
      )}
    </div>
  );
}

function RenderSentence({
  sentence,
}: {
  sentence: RouterOutputs["sentences"]["getSentence"];
}) {
  const utils = api.useUtils();
  const fontSize = useAppStore((state) => state.fontSize);

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
    <div
      ref={ref}
      className="flex flex-wrap"
      style={{
        columnGap: `${(0.5 * fontSize) / 16}rem`,
        rowGap: `${(2 * fontSize) / 16}rem`,
      }}
    >
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
  const { userSettings } = useUserSettings();
  const fontSize = useAppStore((state) => state.fontSize);

  return (
    <div
      className="flex flex-wrap"
      style={{
        columnGap: `${(0.5 * fontSize) / 16}rem`,
        rowGap: `${(2 * fontSize) / 16}rem`,
      }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div className="flex flex-col items-center gap-2" key={i}>
          {userSettings.interlinearLines.map((line) => (
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
      ))}
    </div>
  );
});
