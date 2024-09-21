import type { ReactNode } from "react";
import { notFound, redirect, RedirectType } from "next/navigation";

import { OnboardingRoutes } from "~/utils/constants";
import { getPracticeLanguage, getUserSettings } from "../../../utils";
import AppBar from "./app-bar";

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { practiceLanguage: string; language: string };
}) {
  const userSettings = await getUserSettings();
  if (!userSettings.nativeLanguage) {
    redirect(
      `/${params.language}${OnboardingRoutes.nativeLanguage}`,
      RedirectType.replace,
    );
  }

  try {
    await getPracticeLanguage(params.practiceLanguage);

    return (
      <>
        <AppBar />
        {children}
      </>
    );
  } catch (error) {
    notFound();
  }
}
