"use client";

import type { DialogProps } from "@radix-ui/react-dialog";
import { useCallback, useState } from "react";
import { Loader2Icon } from "lucide-react";

import type { Collection } from "@acme/db/schema";

import type { UseDialogHookValue } from "./types";
import UpdateCollectionForm from "../forms/update-collection-form";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export type UpdateCollectionDialogProps = DialogProps & {
  onUpdated?: (collection: Collection) => void;
  collection: Collection;
};

export default function UpdateCollectionDialog({
  collection,
  ...props
}: UpdateCollectionDialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
        </DialogHeader>
        <UpdateCollectionForm
          onUpdated={props.onUpdated}
          collection={collection}
        >
          {({ isLoading, form }) => (
            <DialogFooter>
              <DialogClose asChild>
                <Button type="reset" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={isLoading ?? !form.formState.isDirty}>
                {isLoading && <Loader2Icon className="-ml-1 mr-2 h-4 w-4" />}
                Update Collection
              </Button>
            </DialogFooter>
          )}
        </UpdateCollectionForm>
      </DialogContent>
    </Dialog>
  );
}

export function useUpdateCollectionDialog(): UseDialogHookValue<UpdateCollectionDialogProps> {
  const [open, setOpen] = useState(false);

  const Dialog = useCallback(
    (props: UpdateCollectionDialogProps) => (
      <UpdateCollectionDialog open={open} onOpenChange={setOpen} {...props} />
    ),
    [open],
  );

  return [Dialog, open, setOpen];
}
