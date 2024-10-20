import dynamic from "next/dynamic";

const ContentView = dynamic(() => import("./content-view"), { ssr: false });
const RightBar = dynamic(() => import("./right-bar"), { ssr: false });

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
