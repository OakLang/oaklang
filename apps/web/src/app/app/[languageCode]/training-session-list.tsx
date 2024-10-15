"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

import type { LanguageCodeParams } from "~/types";
import RenderInfiniteQueryResult from "~/components/RenderInfiniteQueryResult";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

export default function TrainingSessionList() {
  const { languageCode } = useParams<LanguageCodeParams>();
  const t = useTranslations("App");
  const trainingSessionsQuery =
    api.trainingSessions.getTrainingSessions.useInfiniteQuery(
      { languageCode },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <p className="text-lg font-semibold">Training Sessions</p>
      </div>

      <RenderInfiniteQueryResult
        query={trainingSessionsQuery}
        renderLoading={() => (
          <div className="grid gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        )}
      >
        {({ data: { pages } }) => (
          <div className="grid gap-4">
            {pages.map((page) =>
              page.list.map((item) => (
                <Link
                  key={item.id}
                  href={`/app/${item.languageCode}/training/${item.id}`}
                  className="ring-offset-background focus-visible:ring-ring bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground flex flex-shrink-0 flex-col rounded-lg border p-4 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 md:p-6"
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Topic: {item.topic ?? "No topic"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    <span>
                      {t("started")}{" "}
                      {formatDistanceToNow(item.createdAt, {
                        addSuffix: true,
                      })}
                    </span>
                    {" • "}
                    <span>
                      {t("language")}: {item.languageName}
                    </span>
                    {" • "}
                    <span>
                      {t("complexity")}: {item.complexity}
                    </span>
                    {" • "}
                    <span>New Words: {item.newWordsCount}</span>
                    {" • "}
                    <span>Known Words: {item.knownWordsCount}</span>
                  </p>
                </Link>
              )),
            )}
          </div>
        )}
      </RenderInfiniteQueryResult>
    </div>
  );
}
