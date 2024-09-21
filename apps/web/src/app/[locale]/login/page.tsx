import { RedirectType } from "next/navigation";

import { auth } from "@acme/auth";

import { Link, redirect } from "~/i18n/routing";
import SignIn from "./signin";

export default async function LogInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const session = await auth();

  if (session) {
    return redirect(searchParams.callbackUrl ?? "/app", RedirectType.replace);
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email below to log in
          </p>
        </div>
        <SignIn />
        <p className="text-muted-foreground px-8 text-center text-sm">
          By clicking continue, you agree to our{" "}
          <Link
            className="hover:text-primary underline underline-offset-4"
            href="/terms"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            className="hover:text-primary underline underline-offset-4"
            href="/privacy"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
