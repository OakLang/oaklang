import TrainingSessionList from "./training-session-list";

export const dynamic = "force-dynamic";

export default function AppPage() {
  return (
    <div className="container my-8 max-w-screen-xl space-y-16 px-4 md:px-8">
      <TrainingSessionList />
    </div>
  );
}
