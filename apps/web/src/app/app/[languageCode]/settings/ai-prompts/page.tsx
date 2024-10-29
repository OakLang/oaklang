"use client";

import PageTitle from "~/components/PageTitle";
import { Separator } from "~/components/ui/separator";
import { useHasPowerUserAccess } from "~/hooks/useHasPowerUserAccess";
import Forms from "./forms";

export default function AIPromptsPage() {
  const hasPowerUserAccess = useHasPowerUserAccess();

  return (
    <div className="container mx-auto max-w-screen-md px-4 py-16">
      <PageTitle
        title="AI Prompts"
        description="Manage and customize AI prompts."
      />
      <Separator className="my-8" />
      {hasPowerUserAccess && <Forms />}
    </div>
  );
}
