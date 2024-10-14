import PageTitle from "~/components/PageTitle";
import { Separator } from "~/components/ui/separator";
import LanguagesList from "./languages-list";

export default function LanguagesPage() {
  return (
    <div className="container mx-auto max-w-screen-md px-4 py-16">
      <PageTitle
        title="Languages"
        description="Manage all your practice languages. If you remove a language, you will instantly lose all your data for that language."
      />
      <Separator className="my-8" />
      <LanguagesList />
    </div>
  );
}
