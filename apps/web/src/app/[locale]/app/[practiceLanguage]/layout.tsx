import type { ReactNode } from "react";
import { notFound, RedirectType } from "next/navigation";

import type { PracticeLanguageParams } from "~/types";
import { redirect } from "~/i18n/routing";
import AppStoreProvider from "~/providers/app-store-provider";
import { HydrateClient, trpc } from "~/trpc/server";
import { OnboardingRoutes } from "~/utils/constants";
import { getUserNativeLanguage } from "~/utils/queries";
import AppBar from "./app-bar";

export default async function MainAppLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: PracticeLanguageParams;
}>) {
  const nativeLanguage = await getUserNativeLanguage();
  if (!nativeLanguage) {
    return redirect(OnboardingRoutes.nativeLanguage, RedirectType.replace);
  }

  try {
    const practiceLanguage = await trpc.languages.getPracticeLanguage(
      params.practiceLanguage,
    );
    void trpc.languages.getPracticeLanguage.prefetch(params.practiceLanguage, {
      initialData: practiceLanguage,
    });

    return (
      <HydrateClient>
        <AppStoreProvider>
          <AppBar practiceLanguage={params.practiceLanguage} />
          {children}
        </AppStoreProvider>
      </HydrateClient>
    );
  } catch (error) {
    notFound();
  }
}
