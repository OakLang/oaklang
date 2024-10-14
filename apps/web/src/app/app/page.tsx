import { notFound, redirect, RedirectType } from "next/navigation";

import { auth } from "@acme/auth";

import { OnboardingRoutes } from "~/utils/constants";
import {
  getLastPracticeLanguage,
  getUserNativeLanguage,
} from "~/utils/queries";

export default async function AppPage() {
  const session = await auth();
  if (!session) {
    notFound();
  }

  const nativeLanguage = await getUserNativeLanguage();

  if (!nativeLanguage) {
    redirect(OnboardingRoutes.nativeLanguage, RedirectType.replace);
  }

  const lastPracticeLang = await getLastPracticeLanguage(session.user.id);

  if (!lastPracticeLang) {
    redirect(OnboardingRoutes.practiceLanguage, RedirectType.replace);
  }

  redirect(`/app/${lastPracticeLang.languageCode}`, RedirectType.replace);
}
