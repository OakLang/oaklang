"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";

import FullScreenLoader from "~/app/full-screen-loader";
import UserSettingsStoreProvider from "~/providers/user-settings-store-provider";
import { api } from "~/trpc/react";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { status } = useSession({
    required: true,
  });
  const userSettingsQuery = api.userSettings.getUserSettings.useQuery(
    undefined,
    {
      enabled: status === "authenticated",
    },
  );

  if (status != "authenticated" || userSettingsQuery.isPending) {
    return <FullScreenLoader />;
  }

  if (userSettingsQuery.isError) {
    return <p>{userSettingsQuery.error.message}</p>;
  }

  return (
    <UserSettingsStoreProvider userSettings={userSettingsQuery.data}>
      {children}
    </UserSettingsStoreProvider>
  );
}
