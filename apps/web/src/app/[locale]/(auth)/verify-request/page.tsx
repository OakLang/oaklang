import { notFound, RedirectType } from "next/navigation";
import { MailCheckIcon } from "lucide-react";

import { auth } from "@acme/auth";

import { redirect } from "~/i18n/routing";

export default async function VerfiyPage({
  searchParams,
}: {
  searchParams: { provider?: string; type?: string };
}) {
  const session = await auth();
  if (session) {
    return redirect("/app", RedirectType.replace);
  }

  if (searchParams.type === "email" && searchParams.provider === "resend") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex max-w-md flex-col items-center px-6 py-16">
          <MailCheckIcon className="h-10 w-10" />
          <h1 className="mt-8 text-center text-2xl font-semibold">
            Check your Email
          </h1>
          <p className="text-muted-foreground mt-2 w-full max-w-screen-md text-center">
            A sign in link has been sent to your email address.
          </p>
        </div>
      </div>
    );
  }

  notFound();
}
