import { redirect, RedirectType } from "next/navigation";

import { auth } from "@acme/auth";

import SignIn from "./signin";

export default async function LogInPage() {
  const session = await auth();
  if (session) {
    redirect("/", RedirectType.replace);
  }
  return (
    <div>
      <SignIn />
    </div>
  );
}
