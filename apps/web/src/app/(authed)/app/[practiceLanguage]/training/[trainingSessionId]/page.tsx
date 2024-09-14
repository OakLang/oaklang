import { eq } from "@acme/db";
import { db } from "@acme/db/client";
import { trainingSessions } from "@acme/db/schema";

import { APP_NAME } from "~/utils/constants";
import Training from "./training";

interface Props {
  params: { trainingSessionId: string };
}

export async function generateMetadata(props: Props) {
  const [trainingSession] = await db
    .select({ title: trainingSessions.title })
    .from(trainingSessions)
    .where(eq(trainingSessions.id, props.params.trainingSessionId));
  return {
    title: `${trainingSession?.title ?? "Untitled"} - ${APP_NAME}`,
  };
}

export default function TrainingSessionPage() {
  return <Training />;
}
