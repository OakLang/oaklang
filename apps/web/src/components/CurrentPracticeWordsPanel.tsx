import React from "react";
import { useParams } from "next/navigation";
import { RefreshCcw } from "lucide-react";

import { api } from "~/trpc/react";
import { formatDate } from "~/utils";
import { Button } from "./ui/button";

export default function CurrentPracticeWordsPanel() {
  const { practiceLanguage } = useParams<{ practiceLanguage: string }>();
  const words = api.words.getCurrentPracticeWords.useQuery({
    languageCode: practiceLanguage,
  });
  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Current Practice Words</h2>
        <Button
          size="icon"
          variant="outline"
          disabled={words.isPending}
          onClick={() => words.refetch()}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      <div>
        {words.isPending ? (
          <p>Loading...</p>
        ) : words.isError ? (
          <p>{words.error.message}</p>
        ) : (
          <div className="grid gap-4">
            {words.data.map((word) => (
              <div>
                <p>{word.word}</p>
                <div className="">
                  {Object.entries({
                    "Last Seen At": word.lastSeenAt
                      ? formatDate(word.lastSeenAt)
                      : null,
                    "Last Practiced At": word.lastPracticedAt
                      ? formatDate(word.lastPracticedAt)
                      : null,
                    "Next Practice At": word.nextPracticeAt
                      ? formatDate(word.nextPracticeAt)
                      : null,
                    "Seen Count": word.seenCount.toLocaleString(),
                    "Practice Count": word.practiceCount.toLocaleString(),
                    "Seen Count Since Last Practiced":
                      word.seenCountSinceLastPracticed.toLocaleString(),
                    "Spaced Repetition Stage": word.spacedRepetitionStage,
                  }).map((item) => (
                    <div
                      key={item[0]}
                      className="flex items-center justify-between"
                    >
                      <p className="text-muted-foreground text-sm">{item[0]}</p>
                      <p className="text-muted-foreground text-sm">
                        {item[1] ?? "-"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
