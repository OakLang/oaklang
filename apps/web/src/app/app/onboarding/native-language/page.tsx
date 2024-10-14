import { redirect, RedirectType } from "next/navigation";

import { OnboardingRoutes } from "~/utils/constants";
import { getUserNativeLanguage } from "~/utils/queries";
import NativeLanguageForm from "./native-language-form";

export default async function OnboardingNativeLanguagePage() {
  const nativeLanguage = await getUserNativeLanguage();
  const nextPath = OnboardingRoutes.practiceLanguage;

  if (nativeLanguage) {
    redirect(nextPath, RedirectType.replace);
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
