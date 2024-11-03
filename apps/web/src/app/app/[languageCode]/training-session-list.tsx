"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronDownIcon,
  CopyIcon,
  EditIcon,
  FilterIcon,
  LanguagesIcon,
  MoreHorizontal,
  SearchIcon,
  SlidersIcon,
  TrashIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { RouterOutputs } from "~/trpc/react";
import type { LanguageCodeParams } from "~/types";
import RenderInfiniteQueryResult from "~/components/RenderInfiniteQueryResult";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import { unimplementedToast } from "~/utils/helpers";
import StartLearningButton from "./start-learning-button";

export default function TrainingSessionList() {
  const { languageCode } = useParams<LanguageCodeParams>();

  const trainingSessionsQuery =
    api.trainingSessions.getTrainingSessions.useInfiniteQuery(
      { languageCode },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Sessions</h2>
      </div>
      <div className="flex justify-between gap-2 max-md:flex-col md:items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <FilterIcon className="-ml-1 mr-2 h-4 w-4" />
            Filter
            <ChevronDownIcon className="-mr-1 ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline">
            <SlidersIcon className="-ml-1 mr-2 h-4 w-4" />
            Display
            <ChevronDownIcon className="-mr-1 ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <form className="relative w-full flex-1 md:w-64">
            <Input placeholder="search" className="w-full pl-9" />
            <SearchIcon className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          </form>
          <StartLearningButton />
        </div>
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
        {({ data: { pages } }) => {
          if (pages[0]?.list.length === 0) {
            return (
              <div className="rounded-lg border py-16">
                <div className="mx-auto max-w-lg px-4">
                  <p className="text-center font-semibold">No sessions found</p>
                  <p className="text-muted-foreground mt-2 text-center text-sm">
                    Start learing by creating a new session. Click on the start
                    learing button below to start your first session.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <StartLearningButton />
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div className="grid gap-4">
              {pages.map((page) =>
                page.list.map((item) => <SessionCard session={item} />),
              )}
            </div>
          );
        }}
      </RenderInfiniteQueryResult>
    </div>
  );
}

function SessionCard({
  session: item,
}: {
  session: RouterOutputs["trainingSessions"]["getTrainingSessions"]["list"][number];
}) {
  const t = useTranslations("App");

  const utils = api.useUtils();
  const deleteTrainingSessionMut =
    api.trainingSessions.deleteTrainingSession.useMutation({
      onSuccess: (data) => {
        void utils.trainingSessions.getTrainingSessions.invalidate({
          languageCode: data.languageCode,
        });
        toast("Successfully deleted session!");
      },
      onError: (error) => {
        toast("Failed to delete session!", {
          description: error.message,
        });
      },
    });

  return (
    <div className="bg-card text-card-foreground hover:bg-secondary/50 group relative flex items-center gap-4 rounded-lg border p-4 text-left shadow-sm transition-colors">
      <Link
        href={`/app/${item.languageCode}/training/${item.id}`}
        className="focus-visible:ring-ring ring-offset-background absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      />
      <div className="flex-1">
        <p className="line-clamp-2 font-medium">{item.title}</p>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-sm max-md:hidden">
            Started{" "}
            {formatDistanceToNow(item.createdAt, {
              addSuffix: true,
            })}
          </p>
          <p className="text-muted-foreground text-sm md:hidden">
            {formatDistanceToNow(item.createdAt, {
              addSuffix: false,
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-muted-foreground flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-sm">
          <span className="text-xs max-md:hidden">New Words</span>
          <span className="text-xs md:hidden">NW</span>
          {item.newWordsCount}
        </div>
        <div className="text-muted-foreground flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-sm">
          <span className="text-xs max-md:hidden">Known Words</span>
          <span className="text-xs md:hidden">KW</span>
          {item.knownWordsCount}
        </div>
        <div className="text-muted-foreground flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-sm">
          <LanguagesIcon className="h-4 w-4" />
          <span className="max-md:hidden">{item.language.name}</span>
          <span className="md:hidden">{item.language.code}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="z-10 group-hover:border"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom">
            <DropdownMenuItem
              onClick={() => {
                unimplementedToast();
              }}
            >
              <EditIcon className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                unimplementedToast();
              }}
            >
              <CopyIcon className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                deleteTrainingSessionMut.mutate({
                  trainingSessionId: item.id,
                });
              }}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
