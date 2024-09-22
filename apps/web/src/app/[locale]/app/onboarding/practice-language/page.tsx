"use client";

import { useEffect } from "react";

import FullScreenLoader from "~/app/full-screen-loader";
import { useRouter } from "~/i18n/routing";
import { api } from "~/trpc/react";
import { OnboardingRoutes } from "~/utils/constants";
import PracticeLanguageForm from "./practice-language-form";

export default function OnboardinPracticeLanguagePage() {
  const userSettings = api.userSettings.getUserSettings.useQuery();
  const lastPracticedLanguage = api.languages.getLastPracticeLanguage.useQuery(
    undefined,
    {
      enabled: !!userSettings.data?.nativeLanguage,
    },
  );

  const router = useRouter();

  useEffect(() => {
    if (userSettings.isSuccess && !userSettings.data.nativeLanguage) {
      router.replace(OnboardingRoutes.nativeLanguage);
    }
  }, [router, userSettings.data?.nativeLanguage, userSettings.isSuccess]);

  useEffect(() => {
    if (lastPracticedLanguage.isSuccess && lastPracticedLanguage.data) {
      router.replace(`/app/${lastPracticedLanguage.data.languageCode}`);
    }
  }, [lastPracticedLanguage.data, lastPracticedLanguage.isSuccess, router]);

  if (userSettings.isPending || lastPracticedLanguage.isPending) {
    return <FullScreenLoader />;
  }

  if (userSettings.isError) {
    return <p>{userSettings.error.message}</p>;
  }

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
