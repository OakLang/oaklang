"use client";

import WordInspectionPanel from "~/components/WordInspectionPanel";
import { useTrainingSession } from "~/providers/TrainingSessionProvider";

export default function RightBar() {
  const { sidebarOpen, inspectedWord } = useTrainingSession();

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
