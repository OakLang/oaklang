import { Suspense } from "react";

import { auth } from "@acme/auth";
import { APP_NAME } from "@acme/core/constants";

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Link } from "~/i18n/routing";

export default function NavBar() {
  return (
    <header className="bg-card text-card-foreground sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-2 px-4 md:px-8">
        <h1 className="text-lg font-semibold">
          <Link href="/">{APP_NAME}</Link>
        </h1>
        <div className="flex-1" />
        <Suspense fallback={<Skeleton className="h-10 w-32" />}>
          <AuthButton />
        </Suspense>
      </div>
    </header>
  );
}

async function AuthButton() {
  const session = await auth();

  if (session) {
    return (
      <Button asChild variant="outline">
        <Link href="/app">Dashboard</Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild variant="outline">
        <Link href="/login">Log In</Link>
      </Button>

      <Button asChild>
        <Link href="/signup">Get Started</Link>
      </Button>
    </>
  );
}
