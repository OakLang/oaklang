import { Loader2 } from "lucide-react";

import { useTrainingSessionId } from "~/hooks/useTrainingSessionId";
import { api } from "~/trpc/react";
import { formatDate } from "~/utils";
import ObjectDetailsList from "./ObjectDetailsList";

export default function CurrentPracticeWordsPanel() {
  const trainingSessionId = useTrainingSessionId();
  const trainingSessionQuery = api.trainingSessions.getTrainingSession.useQuery(
    { trainingSessionId },
  );

  if (trainingSessionQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (trainingSessionQuery.isError) {
    return <p>{trainingSessionQuery.error.message}</p>;
  }

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <h2 className="font-semibold">Training Session Details</h2>
        </div>

        <ObjectDetailsList
          data={{
            Id: trainingSessionQuery.data.id,
            "User Id": trainingSessionQuery.data.userId,
            "Created At": formatDate(trainingSessionQuery.data.createdAt),
            Name: trainingSessionQuery.data.title,
            Complexity: trainingSessionQuery.data.complexity,
            "Language Code": trainingSessionQuery.data.languageCode,
            Topic: trainingSessionQuery.data.topic,
          }}
        />
      </div>
    </div>
  );
}
