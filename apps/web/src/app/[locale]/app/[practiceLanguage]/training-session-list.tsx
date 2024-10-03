"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

import StartTrainingDialog from "~/components/dialogs/start-training-dialog";
import { Button } from "~/components/ui/button";
import { usePracticeLanguageCode } from "~/hooks/usePracticeLanguageCode";
import { Link } from "~/i18n/routing";
import { api } from "~/trpc/react";

export default function TrainingSessionList() {
  const [showStartTrainingDialog, setShowStartTrainingDialog] = useState(false);
  const t = useTranslations("App");
  const practiceLanguage = usePracticeLanguageCode();
  const trainingSessionsQuery =
    api.trainingSessions.getTrainingSessions.useQuery({
      languageCode: practiceLanguage,
    });

  return (
    <div className="container my-8 max-w-screen-xl">
      <div className="flex gap-4 p-4">
        <div className="flex-1"></div>
        <Button
          onClick={() => setShowStartTrainingDialog(!showStartTrainingDialog)}
        >
          {t("start-training")}
        </Button>
        <StartTrainingDialog
          open={showStartTrainingDialog}
          onOpenChange={setShowStartTrainingDialog}
        />
      </div>
      <div className="bg-border my-4 h-px"></div>
      <div>
        <div className="p-4">
          <p className="text-lg font-medium">{t("sessions")}</p>
        </div>
        {trainingSessionsQuery.isPending ? (
          <p>{t("loading")}</p>
        ) : trainingSessionsQuery.isError ? (
          <p>{trainingSessionsQuery.error.message}</p>
        ) : (
          trainingSessionsQuery.data.map((item) => (
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
          ))
        )}
      </div>
    </div>
  );
}
