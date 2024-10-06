import type { ReactNode } from "react";
import { notFound, RedirectType } from "next/navigation";

import { auth, signOut } from "@acme/auth";

import { Button } from "~/components/ui/button";
import { Link, redirect } from "~/i18n/routing";
import { HydrateClient, trpc } from "~/trpc/server";
import { getUser } from "~/utils/queries";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) {
    return redirect("/login", RedirectType.replace);
  }

  const user = await getUser(session.user.id);

  if (!user) {
    notFound();
  }

  if (user.isBlocked) {
    return (
      <div className="flex flex-1 flex-col justify-center">
        <div className="mx-auto my-16 w-full max-w-screen-md space-y-4 px-8">
          <h1 className="text-2xl font-semibold">
            Access Denied - Your Account is Blocked
          </h1>
          <p className="text-muted-foreground">
            We regret to inform you that your account has been temporarily
            blocked due to policy violations. Please contact support if you
            believe this is an error, and we’ll assist you in resolving the
            issue.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="mailto:auth_request@oaklang.com">Contact Us</Link>
            </Button>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <Button variant="outline">Log Out</Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  void trpc.userSettings.getUserSettings.prefetch();

  return <HydrateClient>{children}</HydrateClient>;
}
