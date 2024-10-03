import { cache } from "react";

import { auth } from "@acme/auth";
import { eq } from "@acme/db";
import { db } from "@acme/db/client";
import { userSettings } from "@acme/db/schema";

import "server-only";

export const getUserNativeLanguage = cache(async () => {
  const session = await auth();
  if (!session) {
    return null;
  }
  const [row] = await db
    .select({
      nativeLanguage: userSettings.nativeLanguage,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id));
  return row?.nativeLanguage ?? null;
});
