"use client";

import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export default function ResendEmail() {
  const mut = api.users.testReceiverEmail.useMutation();
  return <Button onClick={() => mut.mutate()}>Resend</Button>;
}
