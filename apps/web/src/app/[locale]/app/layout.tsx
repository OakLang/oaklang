import type { ReactNode } from "react";
import { RedirectType } from "next/navigation";

import { auth } from "@acme/auth";

import { redirect } from "~/i18n/routing";
import { HydrateClient, trpc } from "~/trpc/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) {
    return redirect("/login", RedirectType.replace);
  }

  void trpc.userSettings.getUserSettings.prefetch();
  void trpc.languages.getLanguages.prefetch();

  return <HydrateClient>{children}</HydrateClient>;
}
