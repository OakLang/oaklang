"use client";

import { useEffect } from "react";

import FullScreenLoader from "~/app/full-screen-loader";
import { useRouter } from "~/i18n/routing";
import { api } from "~/trpc/react";
import { OnboardingRoutes } from "~/utils/constants";
import NativeLanguageForm from "./native-language-form";

export default function OnboardingNativeLanguagePage() {
  const userSettings = api.userSettings.getUserSettings.useQuery();
  const nextPath = OnboardingRoutes.practiceLanguage;

  const router = useRouter();

  useEffect(() => {
    if (userSettings.isSuccess && userSettings.data.nativeLanguage) {
      router.replace(nextPath);
    }
  }, [
    nextPath,
    router,
    userSettings.data?.nativeLanguage,
    userSettings.isSuccess,
  ]);

  if (userSettings.isPending) {
    return <FullScreenLoader />;
  }

  if (userSettings.isError) {
    return <p>{userSettings.error.message}</p>;
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
          <NativeLanguageForm nextPath={nextPath} />
        </div>
      </div>
    </div>
  );
}
