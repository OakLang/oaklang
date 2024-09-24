"use client";

import WordInspectionPanel from "~/components/WordInspectionPanel";
import { useAppStore } from "~/providers/app-store-provider";

export default function RightBar() {
  const sidebarOpen = useAppStore((state) => state.inspectionPanelOpen);
  const inspectedWordId = useAppStore((state) => state.inspectedWordId);

  if (!sidebarOpen) {
    return null;
  }

  return (
    <aside className="w-96 flex-shrink-0 border-l">
      {inspectedWordId ? (
        <WordInspectionPanel wordId={inspectedWordId} />
      ) : (
        <p className="text-muted-foreground p-4">Select a word</p>
      )}
    </aside>
  );
}
