import type { ReactNode } from "react";
import { redirect, RedirectType } from "next/navigation";

import { auth } from "@acme/auth";

import UserSettingsProvider from "~/providers/UserSettingsProvider";
import { api } from "~/trpc/server";

export default async function AuthedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login", RedirectType.replace);
  }
  const userSettings = await api.userSettings.getUserSettings();
  return (
    <UserSettingsProvider userSettings={userSettings}>
      {children}
    </UserSettingsProvider>
  );
}
