import type { ReactNode } from "react";
import { notFound, RedirectType } from "next/navigation";

import { redirect } from "~/i18n/routing";
import { OnboardingRoutes } from "~/utils/constants";
import { getPracticeLanguage, getUserSettings } from "../../../utils";
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
    return redirect(OnboardingRoutes.nativeLanguage, RedirectType.replace);
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
