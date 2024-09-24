"use client";

import CurrentPracticeWordsPanel from "~/components/CurrentPracticeWordsPanel";
import WordInspectionPanel from "~/components/WordInspectionPanel";
import { useAppStore } from "~/providers/app-store-provider";

export default function RightBar() {
  const sidebarOpen = useAppStore((state) => state.inspectionPanelOpen);
  const inspectedWordId = useAppStore((state) => state.inspectedWordId);

  if (!sidebarOpen) {
    return null;
  }

  return (
    <aside className="flex h-[calc(100vh-4rem-1px)] w-96 flex-shrink-0 flex-col overflow-y-auto border-l">
      {inspectedWordId ? (
        <WordInspectionPanel wordId={inspectedWordId} />
      ) : (
        <CurrentPracticeWordsPanel />
      )}
    </aside>
  );
}
