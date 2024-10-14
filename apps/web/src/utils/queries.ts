import { cache } from "react";

import type { Session } from "@acme/auth";
import { auth } from "@acme/auth";
import { eq } from "@acme/db";
import { db } from "@acme/db/client";
import {
  accessRequestsTable,
  userSettingsTable,
  usersTable,
} from "@acme/db/schema";

import "server-only";

export const getUserNativeLanguage = cache(async () => {
  const session = await auth();
  if (!session) {
    return null;
  }
  const [row] = await db
    .select({
      nativeLanguage: userSettingsTable.nativeLanguage,
    })
    .from(userSettingsTable)
    .where(eq(userSettingsTable.userId, session.user.id));
  return row?.nativeLanguage ?? null;
});

export const getUser = cache(async (session?: Session | null) => {
  if (typeof session === "undefined") {
    session = await auth();
  }
  if (!session) {
    return null;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.user.id));
  return user ?? null;
});

export const getAccessRequest = cache(async (userId: string) => {
  const [accessRequest] = await db
    .select()
    .from(accessRequestsTable)
    .where(eq(accessRequestsTable.userId, userId));
  return accessRequest ?? null;
});
