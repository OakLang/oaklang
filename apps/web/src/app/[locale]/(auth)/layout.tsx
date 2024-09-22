"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

import FullScreenLoader from "~/app/full-screen-loader";
import { useRouter } from "~/i18n/routing";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { status } = useSession();

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(
    () => searchParams.get("callbackUrl") ?? "/app",
    [searchParams],
  );

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [callbackUrl, router, status]);

  if (status != "unauthenticated") {
    return <FullScreenLoader />;
  }

  return children;
}
