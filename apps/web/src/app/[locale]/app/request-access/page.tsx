import { notFound } from "next/navigation";

import { auth, signOut } from "@acme/auth";
import { asc, eq } from "@acme/db";
import { db } from "@acme/db/client";
import {
  accessRequestQuestionOptions,
  accessRequestQuestions,
} from "@acme/db/schema";

import { Button } from "~/components/ui/button";
import { Link } from "~/i18n/routing";
import { getAccessRequest } from "~/utils/queries";
import RequestAccess from "./request-access";

export default async function RequestAccessPage() {
  const session = await auth();
  if (!session) {
    notFound();
  }

  const accessRequest = await getAccessRequest(session.user.id);

  if (accessRequest) {
    return (
      <div className="flex flex-1 flex-col justify-center">
        <div className="mx-auto my-16 w-full max-w-screen-md space-y-4 px-8">
          <h1 className="text-2xl font-semibold">
            Access Request Already Submitted
          </h1>
          <p className="text-muted-foreground">
            You’ve already submitted a request for access! Our team is reviewing
            it, and we’ll notify you as soon as there’s an update. Thank you for
            your patience!
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/app">Go Home</Link>
            </Button>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <Button variant="outline">Log Out</Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const questios = await db
    .select()
    .from(accessRequestQuestions)
    .orderBy(asc(accessRequestQuestions.order));

  const questionsWithOptions = await Promise.all(
    questios.map(async (question) => {
      const options = await db
        .select()
        .from(accessRequestQuestionOptions)
        .where(eq(accessRequestQuestionOptions.questionId, question.id))
        .orderBy(asc(accessRequestQuestionOptions.order));
      return {
        ...question,
        options,
      };
    }),
  );

  return <RequestAccess questionsWithOptions={questionsWithOptions} />;
}
