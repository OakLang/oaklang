"use client";

import { useCallback, useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import GoogleIcon from "~/components/icons/google-icon";
import { Button } from "~/components/ui/button";

export default function OAuthProviders({
  type,
  callbackUrl,
}: {
  callbackUrl?: string;
  type: "signin" | "signup";
}) {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      await signIn("google", { callbackUrl: callbackUrl ?? "/app" });
    } catch (error) {
      toast("Failed to sign in with google", {
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  }, [callbackUrl]);

  return (
    <div className="grid gap-2">
      <Button onClick={signInWithGoogle} variant="outline" disabled={loading}>
        <GoogleIcon className="mr-2 h-4 w-4" />
        {type === "signin" ? "Login with Google" : "Sign up with Google"}
      </Button>
    </div>
  );
}
