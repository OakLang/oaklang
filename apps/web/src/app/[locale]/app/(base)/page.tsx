import { RedirectType } from "next/navigation";

import { redirect } from "~/i18n/routing";
import { trpc } from "~/trpc/server";
import { OnboardingRoutes } from "~/utils/constants";
import { getUserNativeLanguage } from "~/utils/queries";

export default async function AppPage() {
  const nativeLanguage = await getUserNativeLanguage();

  if (!nativeLanguage) {
    return redirect(OnboardingRoutes.nativeLanguage, RedirectType.replace);
  }

  const lastPracticeLang = await trpc.languages.getLastPracticeLanguage();

  if (!lastPracticeLang) {
    return redirect(OnboardingRoutes.practiceLanguage, RedirectType.replace);
  }

  return redirect(
    `/app/${lastPracticeLang.languageCode}`,
    RedirectType.replace,
  );
}
