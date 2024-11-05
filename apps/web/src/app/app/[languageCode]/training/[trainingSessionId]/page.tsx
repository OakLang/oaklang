import ContentView from "./content-view";
import RightBar from "./right-bar";

export const dynamic = "force-dynamic";

export default function TrainingPage() {
  return (
    <div className="relative flex h-[calc(100vh-4rem-1px)] overflow-hidden">
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <ContentView />
      </div>
      <RightBar />
    </div>
  );
}
