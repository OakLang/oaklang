import type { ReactNode } from "react";
import { notFound, redirect, RedirectType } from "next/navigation";

import PracticeLanguageProvider from "~/providers/PracticeLanguageProvider";
import { OnboardingRoutes } from "~/utils/constants";
import { getPracticeLanguage, getUserSettings } from "../../utils";
import AppBar from "./app-bar";

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { practiceLanguage: string };
}) {
  const userSettings = await getUserSettings();
  if (!userSettings.nativeLanguage) {
    redirect(OnboardingRoutes.nativeLanguage, RedirectType.replace);
  }

  try {
    const language = await getPracticeLanguage(params.practiceLanguage);

    return (
      <PracticeLanguageProvider practiceLanguage={language}>
        <AppBar />
        {children}
      </PracticeLanguageProvider>
    );
  } catch (error) {
    notFound();
  }
}
