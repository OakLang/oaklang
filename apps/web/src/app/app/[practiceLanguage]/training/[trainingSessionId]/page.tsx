import dynamic from "next/dynamic";

import type { TrainingSessionParams } from "~/types";
import { HydrateClient, trpc } from "~/trpc/server";

const ContentView = dynamic(() => import("./content-view"), { ssr: false });
const TopBar = dynamic(() => import("./top-bar"), { ssr: false });
const RightBar = dynamic(() => import("./right-bar"), { ssr: false });

export default function TrainingPage({
  params,
}: Readonly<{
  params: TrainingSessionParams;
}>) {
  void trpc.sentences.getSentences.prefetch({
    trainingSessionId: params.trainingSessionId,
  });
  return (
    <HydrateClient>
      <div className="relative flex h-[calc(100vh-4rem-1px)] overflow-hidden">
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <ContentView />
        </div>
        <RightBar />
      </div>
    </HydrateClient>
  );
}
