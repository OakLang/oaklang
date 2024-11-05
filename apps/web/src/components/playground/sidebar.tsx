"use client";

import TrainingSessionDetailsSideBarWidget from "~/components/TrainingSessionDetailsSideBarWidget";
import WordInspectionPanel from "~/components/WordInspectionPanel";
import { useAppStore } from "~/store/app-store";

export default function PlaygroundSidebar() {
  const sidebarOpen = useAppStore((state) => state.inspectionPanelOpen);
  const inspectedWord = useAppStore((state) => state.inspectedWord);

  if (!sidebarOpen) {
    return null;
  }

  return (
    <aside className="flex h-full w-96 flex-shrink-0 flex-col overflow-y-auto border-l">
      {inspectedWord ? (
        <WordInspectionPanel word={inspectedWord} />
      ) : (
        <TrainingSessionDetailsSideBarWidget />
      )}
    </aside>
  );
}
