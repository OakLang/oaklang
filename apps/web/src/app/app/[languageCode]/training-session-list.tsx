"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { LanguageCodeParams } from "~/types";
import RenderInfiniteQueryResult from "~/components/RenderInfiniteQueryResult";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import StartLearningButton from "./start-learning-button";

export default function TrainingSessionList() {
  const { languageCode } = useParams<LanguageCodeParams>();
  const t = useTranslations("App");

  const utils = api.useUtils();
  const trainingSessionsQuery =
    api.trainingSessions.getTrainingSessions.useInfiniteQuery(
      { languageCode },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );
  const deleteTrainingSessionMut =
    api.trainingSessions.deleteTrainingSession.useMutation({
      onSuccess: () => {
        void utils.trainingSessions.getTrainingSessions.invalidate({
          languageCode,
        });
        toast("Training Session deleted");
      },
      onError: (error) => {
        toast("Failed to delete training session!", {
          description: error.message,
        });
      },
    });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">Training Sessions</p>
        <StartLearningButton />
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
                <div
                  key={item.id}
                  className="bg-card text-card-foreground hover:bg-accent/50 hover:text-accent-foreground relative flex flex-shrink-0 flex-col rounded-lg border p-4 text-left shadow-sm transition-colors md:p-6"
                >
                  <Link
                    href={`/app/${item.languageCode}/training/${item.id}`}
                    className="focus-visible:ring-ring ring-offset-background absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  />
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-sm">
                    <span>
                      {t("started")}{" "}
                      {formatDistanceToNow(item.createdAt, {
                        addSuffix: true,
                      })}
                    </span>
                    {" • "}
                    <span>
                      {t("language")}: {item.language.name}
                    </span>
                    {" • "}
                    <span>New Words: {item.newWordsCount}</span>
                    {" • "}
                    <span>Known Words: {item.knownWordsCount}</span>
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="absolute right-2 top-2 h-8 w-8"
                        size="icon"
                        variant="ghost"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="bottom">
                      <DropdownMenuItem
                        onClick={() => {
                          deleteTrainingSessionMut.mutate({
                            trainingSessionId: item.id,
                          });
                        }}
                      >
                        Delete Session
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )),
            )}
          </div>
        )}
      </RenderInfiniteQueryResult>
    </div>
  );
}
