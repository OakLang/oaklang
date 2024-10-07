"use client";

import { signOut } from "next-auth/react";

import { Button } from "./ui/button";

export default function LogoutButton({
  title = "Log Out",
}: {
  title?: string;
}) {
  return (
    <Button variant="outline" onClick={() => signOut()}>
      {title}
    </Button>
  );
}
