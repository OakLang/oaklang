"use client";

import { useEffect } from "react";

import FullScreenLoader from "~/app/full-screen-loader";
import { useRouter } from "~/i18n/routing";
import { useUserSettingsStore } from "~/providers/user-settings-store-provider";
import { api } from "~/trpc/react";
import { OnboardingRoutes } from "~/utils/constants";

export default function AppPage() {
  const nativeLanguage = useUserSettingsStore(
    (state) => state.userSettings.nativeLanguage,
  );
  const lastPracticeLang = api.languages.getLastPracticeLanguage.useQuery(
    undefined,
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
