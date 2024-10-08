"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

export default function TrainingSessionList({
  practiceLanguage,
}: {
  practiceLanguage: string;
}) {
  const t = useTranslations("App");
  const { data, isPending, isError, error } =
    api.trainingSessions.getTrainingSessions.useQuery({
      languageCode: practiceLanguage,
    });

  if (isPending) {
    return (
      <div className="grid gap-2">
        <Skeleton className="h-32 w-full rounded-lg border" />
        <Skeleton className="h-32 w-full rounded-lg border" />
        <Skeleton className="h-32 w-full rounded-lg border" />
      </div>
    );
  }

  if (isError) {
    return <p>{error.message}</p>;
  }

  return (
    <div className="grid gap-2">
      {data.map((item) => (
        <Link
          key={item.id}
          href={`/app/${item.languageCode}/training/${item.id}`}
          className="hover:bg-secondary bg-secondary/50 block rounded-lg border px-6 py-4 shadow-sm"
        >
          <p className="font-medium">{item.title}</p>
          <p className="text-muted-foreground text-sm">
            Topic: {item.topic ?? "No topic"}
          </p>
          <p className="text-muted-foreground text-sm">
            <span>
              {t("started")}{" "}
              {formatDistanceToNow(item.createdAt, { addSuffix: true })}
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
      ))}
    </div>
  );
}
