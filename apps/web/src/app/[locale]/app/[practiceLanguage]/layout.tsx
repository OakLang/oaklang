"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useParams } from "next/navigation";

import FullScreenLoader from "~/app/full-screen-loader";
import { Button } from "~/components/ui/button";
import { Link, useRouter } from "~/i18n/routing";
import { useUserSettingsStore } from "~/providers/user-settings-store-provider";
import { api } from "~/trpc/react";
import { OnboardingRoutes } from "~/utils/constants";
import AppBar from "./app-bar";

export default function MainAppLayout({ children }: { children: ReactNode }) {
  const { practiceLanguage } = useParams<{ practiceLanguage: string }>();
  const nativeLanguage = useUserSettingsStore(
    (state) => state.userSettings.nativeLanguage,
  );
  const practiceLanguageQuery = api.languages.getPracticeLanguage.useQuery(
    practiceLanguage,
    {
      enabled: !!nativeLanguage,
    },
  );
  const router = useRouter();

  useEffect(() => {
    if (!nativeLanguage) {
      router.replace(OnboardingRoutes.nativeLanguage);
    }
  }, [router, nativeLanguage]);

  if (practiceLanguageQuery.isPending) {
    return <FullScreenLoader />;
  }

  if (practiceLanguageQuery.isError) {
    return <NotFound />;
  }

  return (
    <>
      <AppBar />
      {children}
    </>
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
