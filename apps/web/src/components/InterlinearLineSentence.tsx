import { createContext, useCallback } from "react";

import type { Sentence } from "@acme/db/schema";

import { useIntersectionObserver } from "~/hooks/useIntersectionObserver";
import { useAppStore } from "~/store/app-store";
import { api } from "~/trpc/react";
import InterlinearLineWordColumn from "./InterlinearLineWordColumn";
import RenderQueryResult from "./RenderQueryResult";
import { Skeleton } from "./ui/skeleton";

export const SentenceContext = createContext<{ sentence: Sentence } | null>(
  null,
);

export default function InterlinearLineSentence({
  sentence,
}: {
  sentence: Sentence;
}) {
  const interlinearLinesPromptTemplate = useAppStore(
    (state) => state.interlinearLinesPromptTemplate,
  );
  const utils = api.useUtils();
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();
  const sentenceWordsQuery = api.sentences.getSentenceWords.useQuery({
    sentenceId: sentence.id,
    promptTemplate: interlinearLinesPromptTemplate,
  });

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
    <SentenceContext.Provider value={{ sentence }}>
      <RenderQueryResult
        query={sentenceWordsQuery}
        renderLoading={() => {
          return new Array(5).fill(0).map((_, i) => (
            <div
              className="mb-16 mr-4 inline-flex flex-col items-center gap-2"
              key={i}
            >
              {userSettingsQuery.data?.interlinearLines.map((line) => (
                <Skeleton
                  className="inline"
                  style={{
                    height: line.style.fontSize,
                    width:
                      (Math.random() * (40 - 10) + 40) *
                      (line.style.fontSize / 16),
                  }}
                  key={line.id}
                />
              ))}
            </div>
          ));
        }}
      >
        {({ data }) => (
          <div ref={ref}>
            {data.map((word) => (
              <InterlinearLineWordColumn key={word.index} word={word} />
            ))}
          </div>
        )}
      </RenderQueryResult>
    </SentenceContext.Provider>
  );
}
