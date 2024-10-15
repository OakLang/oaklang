import { Loader2Icon } from "lucide-react";

import { useTrainingSessionId } from "~/hooks/useTrainingSessionId";
import { api } from "~/trpc/react";
import { formatDate } from "~/utils";
import ObjectDetailsList from "./ObjectDetailsList";
import RenderQueryResult from "./RenderQueryResult";

export default function CurrentPracticeWordsPanel() {
  const trainingSessionId = useTrainingSessionId();
  const trainingSessionQuery = api.trainingSessions.getTrainingSession.useQuery(
    { trainingSessionId },
  );

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <h2 className="font-semibold">Training Session Details</h2>
        </div>

        <RenderQueryResult
          query={trainingSessionQuery}
          renderLoading={() => (
            <div className="flex items-center justify-center py-8">
              <Loader2Icon className="animate-spin" />
            </div>
          )}
        >
          {({ data: trainingSession }) => (
            <ObjectDetailsList
              data={{
                Id: trainingSession.id,
                "User Id": trainingSession.userId,
                "Created At": formatDate(trainingSession.createdAt),
                Name: trainingSession.title,
                Complexity: trainingSession.complexity,
                "Language Code": trainingSession.languageCode,
                Topic: trainingSession.topic,
              }}
            />
          )}
        </RenderQueryResult>
      </div>
    </div>
  );
}
