import type { DialogProps } from "@radix-ui/react-dialog";
import React, { useCallback, useState } from "react";

import type { UseDialogHookValue } from "./types";
import TrainingSessionProvider from "~/providers/training-session-provider";
import TrainingSessionView from "../playground/training-session-view";
import { Sheet, SheetContent, SheetTitle } from "../ui/sheet";

export type TrainingSessionDialogProps = Omit<DialogProps, "children"> & {
  trainingSessionId: string;
};
export default function TrainingSessionDialog({
  trainingSessionId,
  ...props
}: TrainingSessionDialogProps) {
  return (
    <Sheet {...props}>
      <SheetContent side="bottom" className="flex h-screen flex-col p-0">
        <SheetTitle className="hidden">
          Training Session {trainingSessionId}
        </SheetTitle>
        <TrainingSessionProvider trainingSessionId={trainingSessionId}>
          <TrainingSessionView onClose={() => props.onOpenChange?.(false)} />
        </TrainingSessionProvider>
      </SheetContent>
    </Sheet>
  );
}

export function useTrainingSessionDialog(): UseDialogHookValue<TrainingSessionDialogProps> {
  const [open, setOpen] = useState(false);

  const Dialog = useCallback(
    (props: TrainingSessionDialogProps) => (
      <TrainingSessionDialog open={open} onOpenChange={setOpen} {...props} />
    ),
    [open],
  );

  return [Dialog, open, setOpen];
}
