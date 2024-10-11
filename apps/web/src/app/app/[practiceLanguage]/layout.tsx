import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect, RedirectType } from "next/navigation";

import { CONTACT_EMAIL } from "@acme/core/constants";

import type { PracticeLanguageParams } from "~/types";
import FullScreenMessage from "~/components/FullScreenMessage";
import LogoutButton from "~/components/logout-button";
import { Button } from "~/components/ui/button";
import UserNotFound from "~/components/user-not-found";
import AppStoreProvider from "~/providers/app-store-provider";
import { HydrateClient, trpc } from "~/trpc/server";
import { OnboardingRoutes } from "~/utils/constants";
import {
  getAccessRequest,
  getUser,
  getUserNativeLanguage,
} from "~/utils/queries";
import AppBar from "./app-bar";

export default async function MainAppLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: PracticeLanguageParams;
}>) {
  const nativeLanguage = await getUserNativeLanguage();
  if (!nativeLanguage) {
    redirect(OnboardingRoutes.nativeLanguage, RedirectType.replace);
  }

  try {
    const practiceLanguage = await trpc.languages.getPracticeLanguage({
      languageCode: params.practiceLanguage,
    });
    void trpc.languages.getPracticeLanguage.prefetch(
      { languageCode: params.practiceLanguage },
      {
        initialData: practiceLanguage,
      },
    );
  } catch (error) {
    notFound();
  }

  const user = await getUser();
  if (!user) {
    return <UserNotFound />;
  }

  const accessRequest = await getAccessRequest(user.id);

  if (!accessRequest) {
    return (
      <FullScreenMessage
        title="Access Needed - Request to Join Testing"
        description="You currently do not have access to the testing phase. To participate, please click the button below to request access. Our team will review your request and get back to you shortly."
      >
        <Button asChild>
          <Link href="/app/request-access">Request Access</Link>
        </Button>
        <LogoutButton />
      </FullScreenMessage>
    );
  }

  if (accessRequest.status === "pending") {
    return (
      <FullScreenMessage
        title="Access Request Received - Review in Progress"
        description="Thank you for submitting your access request! Our team is currently reviewing your application, and we’ll notify you as soon as your request is processed. We appreciate your interest and patience during this beta phase."
      >
        <Button asChild variant="outline">
          <Link href={`mailto:${CONTACT_EMAIL}`}>Contact Us</Link>
        </Button>
        <LogoutButton />
      </FullScreenMessage>
    );
  }

  if (accessRequest.status === "rejected") {
    return (
      <FullScreenMessage
        title="Access Request Rejected"
        description="We’re sorry, but your request has not been approved at this time.
As we are currently offering limited access, we could not accommodate your request."
      >
        <Button asChild variant="outline">
          <Link href={`mailto:${CONTACT_EMAIL}`}>Contact Us</Link>
        </Button>
        <LogoutButton />
      </FullScreenMessage>
    );
  }

  return (
    <HydrateClient>
      <AppStoreProvider>
        <AppBar practiceLanguage={params.practiceLanguage} />
        {children}
      </AppStoreProvider>
    </HydrateClient>
  );
}
