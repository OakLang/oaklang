import type { ReactNode } from "react";
import { notFound, redirect, RedirectType } from "next/navigation";

import { auth } from "@acme/auth";
import { and, asc, eq } from "@acme/db";
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
    .where(
      and(
        eq(words.trainingSessionId, trainingSession.id),
        eq(words.isPracticing, true),
      ),
    )
    .orderBy(asc(words.createdAt));
  const knownWords = await db
    .select()
    .from(words)
    .where(
      and(
        eq(words.trainingSessionId, trainingSession.id),
        eq(words.isKnown, true),
      ),
    )
    .orderBy(asc(words.createdAt));

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
