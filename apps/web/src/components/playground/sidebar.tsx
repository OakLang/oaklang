"use client";

import NoInspectionSidebarView from "./no-inspection-sidebar-view";
import { useTrainingSessionView } from "./training-session-view";
import WordInspectionSidebarView from "./word-inspection-sidebar-view";

export default function PlaygroundSidebar() {
  const { inspectedWord, sidebarOpen } = useTrainingSessionView();

  if (!sidebarOpen) {
    return null;
  }

  return (
    <aside className="flex h-full w-96 flex-shrink-0 flex-col overflow-y-auto border-l">
      {inspectedWord ? (
        <WordInspectionSidebarView word={inspectedWord} />
      ) : (
        <NoInspectionSidebarView />
      )}
    </aside>
  );
}
