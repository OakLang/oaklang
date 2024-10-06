import { cache } from "react";

import { auth } from "@acme/auth";
import { eq } from "@acme/db";
import { db } from "@acme/db/client";
import { accessRequests, users, userSettings } from "@acme/db/schema";

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

export const getUser = cache(async (userId: string) => {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user ?? null;
});

export const getAccessRequest = cache(async (userId: string) => {
  const [accessRequest] = await db
    .select()
    .from(accessRequests)
    .where(eq(accessRequests.userId, userId));
  return accessRequest ?? null;
});
