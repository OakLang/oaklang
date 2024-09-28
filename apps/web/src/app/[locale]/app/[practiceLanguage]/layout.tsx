"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

import FullScreenLoader from "~/app/full-screen-loader";
import { Button } from "~/components/ui/button";
import { usePracticeLanguageCode } from "~/hooks/usePracticeLanguageCode";
import { Link, useRouter } from "~/i18n/routing";
import AppStoreProvider from "~/providers/app-store-provider";
import { api } from "~/trpc/react";
import { OnboardingRoutes } from "~/utils/constants";
import AppBar from "./app-bar";

export default function MainAppLayout({ children }: { children: ReactNode }) {
  const practiceLanguage = usePracticeLanguageCode();
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();
  const practiceLanguageQuery = api.languages.getPracticeLanguage.useQuery(
    practiceLanguage,
    { enabled: !!userSettingsQuery.data?.nativeLanguage },
  );
  const router = useRouter();

  useEffect(() => {
    if (userSettingsQuery.isSuccess && !userSettingsQuery.data.nativeLanguage) {
      router.replace(OnboardingRoutes.nativeLanguage);
    }
  }, [
    router,
    userSettingsQuery.isSuccess,
    userSettingsQuery.data?.nativeLanguage,
  ]);

  if (practiceLanguageQuery.isPending) {
    return <FullScreenLoader />;
  }

  if (practiceLanguageQuery.isError) {
    return <NotFound />;
  }

  return (
    <AppStoreProvider>
      <AppBar />
      {children}
    </AppStoreProvider>
  );
}

function NotFound() {
  return (
    <div>
      <p>Practice Language Not Found!</p>
      <Button asChild>
        <Link href="/app">Dashboard</Link>
      </Button>
    </div>
  );
}
