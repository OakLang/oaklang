import { APP_NAME } from "@acme/core/constants";

import { Link } from "~/i18n/routing";
import EmailSignInForm from "../email-signin-form";
import OAuthProviders from "../oauth-providers";

export default function SignUpPage({
  searchParams: { callbackUrl },
}: {
  searchParams: { callbackUrl?: string };
}) {
  const search = new URLSearchParams();
  if (callbackUrl) {
    search.set("callbackUrl", callbackUrl);
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an {APP_NAME} account
          </h1>
          <p className="text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link
              href={{
                pathname: "/login",
                search: search.toString(),
              }}
              className="hover:text-primary underline underline-offset-4"
            >
              Log in
            </Link>
            .
          </p>
        </div>

        <div className="grid gap-6">
          <EmailSignInForm type="signup" callbackUrl={callbackUrl} />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">
                or
              </span>
            </div>
          </div>

          <OAuthProviders type="signup" callbackUrl={callbackUrl} />
        </div>

        <p className="text-muted-foreground px-8 text-center text-sm">
          By signing up, you agree to our{" "}
          <Link
            className="hover:text-primary underline underline-offset-4"
            href="/legal/terms"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            className="hover:text-primary underline underline-offset-4"
            href="/legal/privacy"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
