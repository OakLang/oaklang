import { useParams } from "next/navigation";
import { Loader2Icon } from "lucide-react";

import type { TrainingSessionParams } from "~/types";
import { api } from "~/trpc/react";
import { formatDate } from "~/utils";
import ObjectDetailsList from "./ObjectDetailsList";
import RenderQueryResult from "./RenderQueryResult";

export default function TrainingSessionDetailsSideBarWidget() {
  const { trainingSessionId } = useParams<TrainingSessionParams>();
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
                "Created At": formatDate(trainingSession.createdAt),
                Name: trainingSession.title,
                Language: trainingSession.language.name,
                Exercise: trainingSession.exercise,
                ...trainingSession.data,
              }}
            />
          )}
        </RenderQueryResult>
      </div>
    </div>
  );
}
