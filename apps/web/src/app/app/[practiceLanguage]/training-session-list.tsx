"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

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
    return <p>Loading...</p>;
  }

  if (isError) {
    return <p>{error.message}</p>;
  }

  return (
    <div>
      {data.map((item) => (
        <Link
          key={item.id}
          href={`/app/${item.languageCode}/training/${item.id}`}
          className="hover:bg-secondary/50 block rounded-md p-4"
        >
          <p>{item.title}</p>
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
