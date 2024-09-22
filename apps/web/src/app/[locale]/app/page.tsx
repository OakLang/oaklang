"use client";

import { useEffect } from "react";

import FullScreenLoader from "~/app/full-screen-loader";
import { useRouter } from "~/i18n/routing";
import { api } from "~/trpc/react";
import { OnboardingRoutes } from "~/utils/constants";

export default function AppPage() {
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();
  const lastPracticeLang = api.languages.getLastPracticeLanguage.useQuery(
    undefined,
    { enabled: !!userSettingsQuery.data?.nativeLanguage },
  );
  const router = useRouter();

  useEffect(() => {
    if (userSettingsQuery.isSuccess && !userSettingsQuery.data.nativeLanguage) {
      router.replace(OnboardingRoutes.nativeLanguage);
    }
  }, [
    router,
    userSettingsQuery.data?.nativeLanguage,
    userSettingsQuery.isSuccess,
  ]);

  useEffect(() => {
    if (lastPracticeLang.isSuccess) {
      if (lastPracticeLang.data) {
        router.replace(`/app/${lastPracticeLang.data.languageCode}`);
      } else {
        router.replace(OnboardingRoutes.practiceLanguage);
      }
    }
  }, [lastPracticeLang.data, lastPracticeLang.isSuccess, router]);

  return <FullScreenLoader />;
}
