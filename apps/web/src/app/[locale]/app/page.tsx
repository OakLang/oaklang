import { RedirectType } from "next/navigation";

import { desc, eq } from "@acme/db";
import { db } from "@acme/db/client";
import { practiceLanguages } from "@acme/db/schema";

import { redirect } from "~/i18n/routing";
import { OnboardingRoutes } from "~/utils/constants";
import { getUserSettings } from "../../utils";

export default async function AppPage() {
  const userSettings = await getUserSettings();

  if (!userSettings.nativeLanguage) {
    return redirect(`${OnboardingRoutes.nativeLanguage}`, RedirectType.replace);
  }

  const [lang] = await db
    .select()
    .from(practiceLanguages)
    .where(eq(practiceLanguages.userId, userSettings.userId))
    .orderBy(desc(practiceLanguages.lastPracticed))
    .limit(1);

  if (!lang) {
    return redirect(
      `${OnboardingRoutes.practiceLanguage}`,
      RedirectType.replace,
    );
  }

  redirect(`/app/${lang.languageCode}`, RedirectType.replace);
}
