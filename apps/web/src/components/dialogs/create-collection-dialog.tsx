"use client";

import type { DialogProps } from "@radix-ui/react-dialog";
import { useCallback, useState } from "react";
import { Loader2Icon } from "lucide-react";

import type { Collection } from "@acme/db/schema";

import type { UseDialogHookValue } from "./types";
import CreateCollectionForm from "../forms/create-collection-form";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export type CreateCollectionDialogProps = DialogProps & {
  onCreated?: (collection: Collection) => void;
};

export default function CreateCollectionDialog({
  ...props
}: CreateCollectionDialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Collection</DialogTitle>
        </DialogHeader>
        <CreateCollectionForm onCreated={props.onCreated}>
          {({ isLoading }) => (
            <DialogFooter>
              <DialogClose asChild>
                <Button type="reset" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={isLoading}>
                {isLoading && <Loader2Icon className="-ml-1 mr-2 h-4 w-4" />}
                Create Collection
              </Button>
            </DialogFooter>
          )}
        </CreateCollectionForm>
      </DialogContent>
    </Dialog>
  );
}

export function useCreateCollectionDialog(): UseDialogHookValue<CreateCollectionDialogProps> {
  const [open, setOpen] = useState(false);

  const Dialog = useCallback(
    (props: CreateCollectionDialogProps) => (
      <CreateCollectionDialog open={open} onOpenChange={setOpen} {...props} />
    ),
    [open],
  );

  return [Dialog, open, setOpen];
}
