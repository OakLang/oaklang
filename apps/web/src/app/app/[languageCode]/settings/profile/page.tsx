import type { LanguageCodeParams } from "~/types";
import PageTitle from "~/components/PageTitle";
import { Separator } from "~/components/ui/separator";
import { HydrateClient, trpc } from "~/trpc/server";
import WardsTable from "./words-table";

export default function ProfileSettingsPage({
  params: { languageCode },
}: Readonly<{ params: LanguageCodeParams }>) {
  void trpc.words.getAllWords.prefetch({
    languageCode,
    filter: "all",
  });

  return (
    <HydrateClient>
      <div className="container mx-auto max-w-screen-lg px-4 py-16">
        <PageTitle title="Profile" description="Manage your profile settings" />
        <Separator className="my-8" />
        <WardsTable languageCode={languageCode} />
      </div>
    </HydrateClient>
  );
}
