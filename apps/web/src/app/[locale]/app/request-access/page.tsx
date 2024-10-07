import { RedirectType } from "next/navigation";

import { asc, eq } from "@acme/db";
import { db } from "@acme/db/client";
import {
  accessRequestQuestionOptions,
  accessRequestQuestions,
} from "@acme/db/schema";

import { redirect } from "~/i18n/routing";
import { getAccessRequest, getUser } from "~/utils/queries";
import RequestAccess from "./request-access";

export default async function RequestAccessPage() {
  const user = await getUser();
  if (!user) {
    throw new Error("User not found!");
  }
  if (user.isAllowedForTesting) {
    return redirect("/app", RedirectType.replace);
  }
  const accessRequest = await getAccessRequest(user.id);
  if (accessRequest) {
    return redirect("/app", RedirectType.replace);
  }

  const questions = await db
    .select()
    .from(accessRequestQuestions)
    .orderBy(asc(accessRequestQuestions.order));

  const questionsWithOptions = await Promise.all(
    questions.map(async (question) => {
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
