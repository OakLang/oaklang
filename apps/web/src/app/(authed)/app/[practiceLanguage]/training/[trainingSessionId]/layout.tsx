import type { ReactNode } from "react";
import { notFound, redirect, RedirectType } from "next/navigation";

import { auth } from "@acme/auth";
import { and, eq } from "@acme/db";
import { db } from "@acme/db/client";
import { trainingSessions } from "@acme/db/schema";

import TrainingSessionProvider from "~/providers/TrainingSessionProvider";

export default async function TrainingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { trainingSessionId: string; practiceLanguage: string };
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
        eq(trainingSessions.language, params.practiceLanguage),
        eq(trainingSessions.userId, session.user.id),
      ),
    );

  if (!trainingSession) {
    notFound();
  }

  return (
    <TrainingSessionProvider trainingSession={trainingSession}>
      {children}
    </TrainingSessionProvider>
  );
}
