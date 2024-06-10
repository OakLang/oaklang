"use client";

import { signIn } from "next-auth/react";

import { Button } from "~/components/ui/button";

export default function SignIn() {
  return (
    <div>
      <h1>Log In</h1>
      <Button onClick={() => signIn()}>Log in with Google</Button>
    </div>
  );
}
