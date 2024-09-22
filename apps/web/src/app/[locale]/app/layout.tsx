"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";

import FullScreenLoader from "~/app/full-screen-loader";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { status } = useSession({
    required: true,
  });

  if (status != "authenticated") {
    return <FullScreenLoader />;
  }

  return children;
}
