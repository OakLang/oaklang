import { RedirectType } from "next/navigation";

import { auth } from "@acme/auth";

import { redirect } from "~/i18n/routing";
import HomePage from "../home/page";

export default async function Home() {
  const session = await auth();
  if (session) {
    redirect("/app", RedirectType.replace);
  }

  return <HomePage />;
}
