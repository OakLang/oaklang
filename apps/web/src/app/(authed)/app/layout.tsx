import type { ReactNode } from "react";
import { redirect, RedirectType } from "next/navigation";

import { api } from "~/trpc/server";
import { OnboardingRoutes } from "~/utils/constants";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const userSettings = await api.userSettings.getUserSettings();

  if (!userSettings.nativeLanguage) {
    redirect(OnboardingRoutes.nativeLanguage, RedirectType.replace);
  }

  return children;
}
