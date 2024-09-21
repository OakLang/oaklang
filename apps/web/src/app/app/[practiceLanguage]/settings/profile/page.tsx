"use client";

import PageTitle from "~/components/PageTitle";
import { Separator } from "~/components/ui/separator";

export default function ProfileSettingsPage() {
  return (
    <div className="container mx-auto max-w-screen-md px-4 py-16">
      <PageTitle title="Profile" description="Manage your profile settings" />

      <Separator className="my-8" />
    </div>
  );
}
