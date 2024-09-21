import ContentView from "./content-view";
import RightBar from "./right-bar";
import TopBar from "./top-bar";

export default function TrainingPage() {
  return (
    <div className="relative flex flex-1">
      <div className="relative flex flex-1 flex-col">
        <TopBar />
        <ContentView />
        {/* <BottomBar /> */}
      </div>
      <RightBar />
    </div>
  );
}
