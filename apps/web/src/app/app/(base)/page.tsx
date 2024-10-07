import { redirect, RedirectType } from "next/navigation";

import { trpc } from "~/trpc/server";
import { OnboardingRoutes } from "~/utils/constants";
import { getUserNativeLanguage } from "~/utils/queries";

export default async function AppPage() {
  const nativeLanguage = await getUserNativeLanguage();

  if (!nativeLanguage) {
    redirect(OnboardingRoutes.nativeLanguage, RedirectType.replace);
  }

  const lastPracticeLang = await trpc.languages.getLastPracticeLanguage();

  if (!lastPracticeLang) {
    redirect(OnboardingRoutes.practiceLanguage, RedirectType.replace);
  }

  redirect(`/app/${lastPracticeLang.languageCode}`, RedirectType.replace);
}
