import { useTranslations } from "next-intl";

import PageTitle from "~/components/PageTitle";
import AudioSection from "./audio-section";
import GeneralSection from "./general-section";
import PromptEditSection from "./prompt-edit-section";
import SpacedRepetitionStagesSection from "./spaced-repetition-stages-section";

export default function PreferencesPage() {
  const t = useTranslations("PreferencesPage");

  return (
    <div className="container mx-auto max-w-screen-md space-y-16 px-4 py-16">
      <PageTitle title={t("title")} description={t("description")} />
      <GeneralSection />
      <AudioSection />
      <SpacedRepetitionStagesSection />
      <PromptEditSection />
    </div>
  );
}
