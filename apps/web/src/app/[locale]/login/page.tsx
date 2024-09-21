"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import GoogleIcon from "~/components/icons/google-icon";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Link } from "~/i18n/routing";

export default function LogInPage() {
  const locale = useLocale();
  const t = useTranslations("LogInPage");

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? `/${locale}/app`;

  const onSignInWithEmailPressed = useCallback(() => {
    toast("Unimplemented!", {
      description: "Please try logging in with Google.",
    });
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </div>

        <div className="grid gap-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSignInWithEmailPressed();
            }}
          >
            <div className="grid gap-4">
              <div className="grid gap-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  type="email"
                />
              </div>
              <Button>{t("signInWithEmail")}</Button>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">
                {t("or")}
              </span>
            </div>
          </div>

          <Button
            onClick={() =>
              signIn("google", {
                callbackUrl,
              })
            }
            variant="outline"
          >
            <GoogleIcon className="mr-2 h-4 w-4" />
            {t("logInWithGoogle")}
          </Button>
        </div>

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
