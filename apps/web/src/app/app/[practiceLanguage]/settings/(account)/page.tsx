import { useTranslations } from "next-intl";

import PageTitle from "~/components/PageTitle";
import { Separator } from "~/components/ui/separator";
import { DeleteAccountCard, ResetAccountCard } from "./cards";

export default function AccountPage() {
  const t = useTranslations("AccountPage");

  return (
    <div className="container mx-auto max-w-screen-md px-4 py-16">
      <PageTitle title={t("title")} description={t("description")} />
      <Separator className="my-8" />
      <ResetAccountCard />
      <Separator className="my-8" />
      <DeleteAccountCard />
    </div>
  );
}
