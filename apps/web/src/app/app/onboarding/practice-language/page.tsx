import { notFound, redirect, RedirectType } from "next/navigation";

import { auth } from "@acme/auth";

import { OnboardingRoutes } from "~/utils/constants";
import {
  getLastPracticeLanguage,
  getUserNativeLanguage,
} from "~/utils/queries";
import PracticeLanguageForm from "./practice-language-form";

export default async function OnboardinPracticeLanguagePage() {
  const session = await auth();
  if (!session) {
    notFound();
  }

  const nativeLanguage = await getUserNativeLanguage();

  if (!nativeLanguage) {
    redirect(OnboardingRoutes.nativeLanguage, RedirectType.replace);
  }

  const lastPracticedLanguage = await getLastPracticeLanguage(session.user.id);

  if (lastPracticedLanguage) {
    redirect(
      `/app/${lastPracticedLanguage.languageCode}`,
      RedirectType.replace,
    );
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
