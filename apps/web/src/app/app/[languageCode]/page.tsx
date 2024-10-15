import CollectionsList from "./collections-list";
import StartLearningButton from "./start-learning-button";
import TrainingSessionList from "./training-session-list";

export default function AppPage() {
  return (
    <div className="container my-8 max-w-screen-xl space-y-16 px-4 md:px-8">
      <div className="flex items-center gap-4">
        <div className="flex flex-1 items-center justify-end gap-2">
          <StartLearningButton />
        </div>
      </div>
      <TrainingSessionList />
      <CollectionsList />
    </div>
  );
}
