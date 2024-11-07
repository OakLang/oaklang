import type { DialogProps } from "@radix-ui/react-dialog";
import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";

import type { Module } from "@acme/db/schema";

import type { UseDialogHookValue } from "./types";
import UpdateModuleForm from "../forms/update-module-form";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export type UpdateModuleDialogProps = Omit<DialogProps, "children"> & {
  module: Module;
  onUpdated?: (module: Module) => void;
};

export default function UpdateModuleDialog({
  module,
  onUpdated,
  ...props
}: UpdateModuleDialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Module</DialogTitle>
        </DialogHeader>
        <UpdateModuleForm module={module} onUpdated={onUpdated}>
          {({ isLoading, form }) => (
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" type="reset">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={!form.formState.isDirty || isLoading}>
                {isLoading && (
                  <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" />
                )}
                Update Module
              </Button>
            </DialogFooter>
          )}
        </UpdateModuleForm>
      </DialogContent>
    </Dialog>
  );
}

export function useUpdateModuleDialog(): UseDialogHookValue<UpdateModuleDialogProps> {
  const [open, setOpen] = useState(false);

  const Dialog = useCallback(
    (props: UpdateModuleDialogProps) => (
      <UpdateModuleDialog open={open} onOpenChange={setOpen} {...props} />
    ),
    [open],
  );

  return [Dialog, open, setOpen];
}
