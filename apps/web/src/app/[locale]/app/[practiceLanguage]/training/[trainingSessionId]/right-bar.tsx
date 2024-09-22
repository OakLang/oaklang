"use client";

import WordInspectionPanel from "~/components/WordInspectionPanel";
import { useTrainingSessionStore } from "~/providers/training-session-store-provider";

export default function RightBar() {
  const sidebarOpen = useTrainingSessionStore(
    (state) => state.inspectionPanelOpen,
  );
  const inspectedWord = useTrainingSessionStore((state) => state.inspectedWord);

  if (!sidebarOpen) {
    return null;
  }

  return (
    <aside className="w-96 flex-shrink-0 border-l">
      {inspectedWord ? (
        <WordInspectionPanel word={inspectedWord} />
      ) : (
        <p className="text-muted-foreground p-4">Select a word</p>
      )}
    </aside>
  );
}
