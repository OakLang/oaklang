import type { ReactNode } from "react";
import { notFound, redirect, RedirectType } from "next/navigation";
import { compareAsc } from "date-fns";

import { auth } from "@acme/auth";
import { and, desc, eq } from "@acme/db";
import { db } from "@acme/db/client";
import { trainingSessions, words } from "@acme/db/schema";

import TrainingSessionProvider from "~/providers/TrainingSessionProvider";

export default async function TrainingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { trainingSessionId: string };
}) {
  const session = await auth();
  if (!session) {
    redirect("/login", RedirectType.replace);
  }

  const [trainingSession] = await db
    .select()
    .from(trainingSessions)
    .where(
      and(
        eq(trainingSessions.id, params.trainingSessionId),
        eq(trainingSessions.userId, session.user.id),
      ),
    );

  if (!trainingSession) {
    notFound();
  }

  const practiceWords = await db
    .select()
    .from(words)
    .where(eq(words.trainingSessionId, trainingSession.id))
    .orderBy(desc(words.createdAt));
  const knownWords = practiceWords
    .filter((w) => w.markedKnownAt)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .sort((a, b) => compareAsc(a.markedKnownAt!, b.markedKnownAt!));

  return (
    <TrainingSessionProvider
      trainingSession={trainingSession}
      practiceWords={practiceWords}
      knownWords={knownWords}
    >
      {children}
    </TrainingSessionProvider>
  );
}
