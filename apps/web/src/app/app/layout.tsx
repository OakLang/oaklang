import type { ReactNode } from "react";
import Link from "next/link";

import { CONTACT_EMAIL } from "@acme/core/constants";

import FullScreenMessage from "~/components/FullScreenMessage";
import LogoutButton from "~/components/logout-button";
import { Button } from "~/components/ui/button";
import UserNotFound from "~/components/user-not-found";
import { HydrateClient, trpc } from "~/trpc/server";
import { getUser } from "~/utils/queries";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getUser();
  if (!user) {
    return <UserNotFound />;
  }

  if (user.isBlocked) {
    return (
      <FullScreenMessage
        title="Access Denied - Your Account is Blocked"
        description="We regret to inform you that your account has been temporarily blocked due to policy violations. Please contact support if you believe this is an error, and we’ll assist you in resolving the issue."
      >
        <Button asChild variant="outline">
          <Link href={`mailto:${CONTACT_EMAIL}`}>Contact Us</Link>
        </Button>
        <LogoutButton />
      </FullScreenMessage>
    );
  }

  await trpc.userSettings.getUserSettings.prefetch();

  return <HydrateClient>{children}</HydrateClient>;
}
