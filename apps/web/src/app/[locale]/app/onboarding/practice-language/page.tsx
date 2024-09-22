"use client";

import { useEffect } from "react";

import FullScreenLoader from "~/app/full-screen-loader";
import { useRouter } from "~/i18n/routing";
import { useUserSettingsStore } from "~/providers/user-settings-store-provider";
import { api } from "~/trpc/react";
import { OnboardingRoutes } from "~/utils/constants";
import PracticeLanguageForm from "./practice-language-form";

export default function OnboardinPracticeLanguagePage() {
  const nativeLanguage = useUserSettingsStore(
    (state) => state.userSettings.nativeLanguage,
  );
  const lastPracticedLanguage = api.languages.getLastPracticeLanguage.useQuery(
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
    if (lastPracticedLanguage.isSuccess && lastPracticedLanguage.data) {
      router.replace(`/app/${lastPracticedLanguage.data.languageCode}`);
    }
  }, [lastPracticedLanguage.data, lastPracticedLanguage.isSuccess, router]);

  if (lastPracticedLanguage.isError) {
    return <p>{lastPracticedLanguage.error.message}</p>;
  }

  if (lastPracticedLanguage.data) {
    return <FullScreenLoader />;
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Which language would you like to practice?
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            You can always add more languages to practice later or change your
            preferences at any time.
          </p>
          <PracticeLanguageForm />
        </div>
      </div>
    </div>
  );
}
