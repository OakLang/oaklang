"use client";

import { useEffect } from "react";

import FullScreenLoader from "~/components/FullScreenLoader";
import { useRouter } from "~/i18n/routing";
import { api } from "~/trpc/react";
import { OnboardingRoutes } from "~/utils/constants";
import NativeLanguageForm from "./native-language-form";

export default function OnboardingNativeLanguagePage() {
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery();
  const nextPath = OnboardingRoutes.practiceLanguage;
  const router = useRouter();

  useEffect(() => {
    if (userSettingsQuery.data?.nativeLanguage) {
      router.replace(nextPath);
    }
  }, [nextPath, router, userSettingsQuery.data?.nativeLanguage]);

  if (!userSettingsQuery.isSuccess || userSettingsQuery.data.nativeLanguage) {
    return <FullScreenLoader />;
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            What is your Native Language?
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            This will set the language of your dictionary translations.
          </p>
          <NativeLanguageForm />
        </div>
      </div>
    </div>
  );
}
