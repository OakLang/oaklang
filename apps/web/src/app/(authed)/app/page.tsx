import { notFound, redirect, RedirectType } from "next/navigation";

import { auth } from "@acme/auth";
import { desc, eq } from "@acme/db";
import { db } from "@acme/db/client";
import { practiceLanguages } from "@acme/db/schema";

export default async function AppPage() {
  const session = await auth();
  if (!session) {
    notFound();
  }

  const [lang] = await db
    .select()
    .from(practiceLanguages)
    .where(eq(practiceLanguages.userId, session.user.id))
    .orderBy(desc(practiceLanguages.lastPracticed))
    .limit(1);

  redirect(`/app/${lang?.langauge ?? "en"}`, RedirectType.replace);
}
