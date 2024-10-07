import React from "react";
import Link from "next/link";

import { CONTACT_EMAIL } from "@acme/core/constants";

import FullScreenMessage from "./FullScreenMessage";
import LogoutButton from "./logout-button";
import { Button } from "./ui/button";

export default function UserNotFound() {
  return (
    <FullScreenMessage
      title="User not found!"
      description="Your account may have been deleted, or your session has expired. Please log out and sign in again to continue. If you need further assistance, feel free to contact our support team."
    >
      <Button asChild variant="outline">
        <Link href={`mailto:${CONTACT_EMAIL}`}>Contact Us</Link>
      </Button>
      <LogoutButton />
    </FullScreenMessage>
  );
}
