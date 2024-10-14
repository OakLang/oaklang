import { redirect, RedirectType } from "next/navigation";

import { asc, eq } from "@acme/db";
import { db } from "@acme/db/client";
import {
  accessRequestQuestionOptionsTable,
  accessRequestQuestionsTable,
} from "@acme/db/schema";

import UserNotFound from "~/components/user-not-found";
import { getAccessRequest, getUser } from "~/utils/queries";
import RequestAccess from "./request-access";

export default async function RequestAccessPage() {
  const user = await getUser();
  if (!user) {
    return <UserNotFound />;
  }
  const accessRequest = await getAccessRequest(user.id);
  if (accessRequest) {
    redirect("/app", RedirectType.replace);
  }

  const questions = await db
    .select()
    .from(accessRequestQuestionsTable)
    .orderBy(asc(accessRequestQuestionsTable.order));

  const questionsWithOptions = await Promise.all(
    questions.map(async (question) => {
      const options = await db
        .select()
        .from(accessRequestQuestionOptionsTable)
        .where(eq(accessRequestQuestionOptionsTable.questionId, question.id))
        .orderBy(asc(accessRequestQuestionOptionsTable.order));
      return {
        ...question,
        options,
      };
    }),
  );

  return <RequestAccess questionsWithOptions={questionsWithOptions} />;
}
