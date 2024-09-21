import { redirect, RedirectType } from "next/navigation";

import { desc, eq } from "@acme/db";
import { db } from "@acme/db/client";
import { practiceLanguages } from "@acme/db/schema";

import { OnboardingRoutes } from "~/utils/constants";
import { getUserSettings } from "../../utils";

export default async function AppPage({
  params,
}: {
  params: { language: string };
}) {
  const userSettings = await getUserSettings();

  if (!userSettings.nativeLanguage) {
    redirect(
      `/${params.language}${OnboardingRoutes.nativeLanguage}`,
      RedirectType.replace,
    );
  }

  const [lang] = await db
    .select()
    .from(practiceLanguages)
    .where(eq(practiceLanguages.userId, userSettings.userId))
    .orderBy(desc(practiceLanguages.lastPracticed))
    .limit(1);

  if (!lang) {
    redirect(
      `/${params.language}${OnboardingRoutes.practiceLanguage}`,
      RedirectType.replace,
    );
  }

  redirect(
    `/${params.language}/app/${lang.languageCode}`,
    RedirectType.replace,
  );
}
