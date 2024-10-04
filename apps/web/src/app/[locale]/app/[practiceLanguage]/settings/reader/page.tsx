import PageTitle from "~/components/PageTitle";
import { Separator } from "~/components/ui/separator";
import InterlinearLineSection from "./interlinear-lines-section";

export default function ReaderPage() {
  return (
    <div className="container mx-auto max-w-screen-md px-4 py-16">
      <PageTitle title="Reader" description="Manage your reader settings" />
      <Separator className="my-8" />
      <InterlinearLineSection />
    </div>
  );
}
