import type { ReactNode } from "react";
import { notFound, RedirectType } from "next/navigation";

import { redirect } from "~/i18n/routing";
import AppStoreProvider from "~/providers/app-store-provider";
import { HydrateClient, trpc } from "~/trpc/server";
import { OnboardingRoutes } from "~/utils/constants";
import AppBar from "./app-bar";

export default async function MainAppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { practiceLanguage: string };
}) {
  const userSettingsQuery = await trpc.userSettings.getUserSettings();
  if (!userSettingsQuery.nativeLanguage) {
    return redirect(OnboardingRoutes.nativeLanguage, RedirectType.replace);
  }

  try {
    await trpc.languages.getPracticeLanguage(params.practiceLanguage);
    void trpc.languages.getPracticeLanguage.prefetch(params.practiceLanguage);
    void trpc.languages.getPracticeLanguages.prefetch();

    return (
      <HydrateClient>
        <AppStoreProvider>
          <AppBar />
          {children}
        </AppStoreProvider>
      </HydrateClient>
    );
  } catch (error) {
    notFound();
  }
}
