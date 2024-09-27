import ContentView from "./content-view";
import RightBar from "./right-bar";
import TopBar from "./top-bar";

export default function TrainingPage() {
  return (
    <div className="relative flex h-[calc(100vh-4rem-1px)] overflow-hidden">
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <ContentView />
        {/* <BottomBar /> */}
      </div>
      <RightBar />
    </div>
  );
}
