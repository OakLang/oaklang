import { useTrainingSession } from "~/providers/training-session-provider";
import { formatDate } from "~/utils";
import ObjectDetailsList from "../ObjectDetailsList";

export default function NoInspectionSidebarView() {
  const { trainingSession } = useTrainingSession();

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <h2 className="font-semibold">Training Session Details</h2>
        </div>

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
      </div>
    </div>
  );
}
