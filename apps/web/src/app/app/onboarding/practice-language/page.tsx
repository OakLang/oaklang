import { redirect, RedirectType } from "next/navigation";

import { desc, eq } from "@acme/db";
import { db } from "@acme/db/client";
import { practiceLanguages } from "@acme/db/schema";

import { OnboardingRoutes } from "~/utils/constants";
import { getUserSettings } from "../../../utils";
import PracticeLanguageForm from "./practice-language-form";

export default async function OnboardinPracticeLanguagePage() {
  const userSettings = await getUserSettings();
  if (!userSettings.nativeLanguage) {
    redirect(OnboardingRoutes.nativeLanguage, RedirectType.replace);
  }

  const [lang] = await db
    .select()
    .from(practiceLanguages)
    .where(eq(practiceLanguages.userId, userSettings.userId))
    .orderBy(desc(practiceLanguages.lastPracticed))
    .limit(1);

  if (lang) {
    redirect(`/app/${lang.languageCode}`, RedirectType.replace);
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
