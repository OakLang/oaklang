"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import GoogleIcon from "~/components/icons/google-icon";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function SignIn() {
  const onSignInWithEmailPressed = useCallback(() => {
    toast("Unimplemented!", {
      description: "Please try logging in with Google.",
    });
  }, []);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/app";

  return (
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
          <Button>Sign In with Email</Button>
        </div>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            Or continue with
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
        Log in with Google
      </Button>
    </div>
  );
}
