import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import PracticeLanguageProvider from "~/providers/PracticeLanguageProvider";
import { api } from "~/trpc/server";
import AppBar from "./app-bar";

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { practiceLanguage: string };
}) {
  try {
    const language = await api.users.getPracticeLanguage(
      params.practiceLanguage,
    );

    return (
      <PracticeLanguageProvider langauge={language}>
        <AppBar />
        {children}
      </PracticeLanguageProvider>
    );
  } catch (error) {
    notFound();
  }
}
