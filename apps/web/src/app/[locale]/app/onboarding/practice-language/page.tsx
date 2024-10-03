import { RedirectType } from "next/navigation";

import { redirect } from "~/i18n/routing";
import { HydrateClient, trpc } from "~/trpc/server";
import { OnboardingRoutes } from "~/utils/constants";
import { getUserNativeLanguage } from "~/utils/queries";
import PracticeLanguageForm from "./practice-language-form";

export default async function OnboardinPracticeLanguagePage() {
  const nativeLanguage = await getUserNativeLanguage();

  if (!nativeLanguage) {
    return redirect(OnboardingRoutes.nativeLanguage, RedirectType.replace);
  }

  const lastPracticedLanguage = await trpc.languages.getLastPracticeLanguage();

  if (lastPracticedLanguage) {
    return redirect(
      `/app/${lastPracticedLanguage.languageCode}`,
      RedirectType.replace,
    );
  }

  void trpc.languages.getLanguages.prefetch();

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
          <HydrateClient>
            <PracticeLanguageForm />
          </HydrateClient>
        </div>
      </div>
    </div>
  );
}
