import type { ReactNode } from "react";
import { notFound, RedirectType } from "next/navigation";

import { auth, signOut } from "@acme/auth";

import type { PracticeLanguageParams } from "~/types";
import { Button } from "~/components/ui/button";
import { Link, redirect } from "~/i18n/routing";
import AppStoreProvider from "~/providers/app-store-provider";
import { HydrateClient, trpc } from "~/trpc/server";
import { OnboardingRoutes } from "~/utils/constants";
import {
  getAccessRequest,
  getUser,
  getUserNativeLanguage,
} from "~/utils/queries";
import AppBar from "./app-bar";
import ResendEmail from "./resend-email";

export default async function MainAppLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: PracticeLanguageParams;
}>) {
  const nativeLanguage = await getUserNativeLanguage();
  if (!nativeLanguage) {
    return redirect(OnboardingRoutes.nativeLanguage, RedirectType.replace);
  }
  const session = await auth();
  if (!session) {
    notFound();
  }

  const user = await getUser(session.user.id);

  if (!user) {
    notFound();
  }

  if (!user.isAllowedForTesting) {
    const accessRequest = await getAccessRequest(session.user.id);
    if (accessRequest) {
      return (
        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto my-16 w-full max-w-screen-md space-y-4 px-8">
            <h1 className="text-2xl font-semibold">
              Access Request Received - Review in Progress
            </h1>
            <p className="text-muted-foreground">
              Thank you for submitting your access request! Our team is
              currently reviewing your application, and we’ll notify you as soon
              as your request is processed. We appreciate your interest and
              patience during this beta phase.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="mailto:auth_request@oaklang.com">Contact Us</Link>
              </Button>
              <ResendEmail />
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
    return (
      <div className="flex flex-1 flex-col justify-center">
        <div className="mx-auto my-16 w-full max-w-screen-md space-y-4 px-8">
          <h1 className="text-2xl font-semibold">
            Access Needed - Request to Join Testing
          </h1>
          <p className="text-muted-foreground">
            You currently do not have access to the testing phase. To
            participate, please click the button below to request access. Our
            team will review your request and get back to you shortly.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/app/request-access">Request Access</Link>
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

  try {
    const practiceLanguage = await trpc.languages.getPracticeLanguage(
      params.practiceLanguage,
    );
    void trpc.languages.getPracticeLanguage.prefetch(params.practiceLanguage, {
      initialData: practiceLanguage,
    });

    return (
      <HydrateClient>
        <AppStoreProvider>
          <AppBar practiceLanguage={params.practiceLanguage} />
          {children}
        </AppStoreProvider>
      </HydrateClient>
    );
  } catch (error) {
    notFound();
  }
}
