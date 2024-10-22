import CollectionsList from "./collections-list";
import TrainingSessionList from "./training-session-list";

export default function AppPage() {
  return (
    <div className="container my-8 max-w-screen-xl space-y-16 px-4 md:px-8">
      <TrainingSessionList />
      <CollectionsList />
    </div>
  );
}
