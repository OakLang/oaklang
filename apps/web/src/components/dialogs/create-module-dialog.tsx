import CreateModuleForm from "../forms/create-module-form";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export interface CreateModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateModuleDialog({
  onOpenChange,
  open,
}: CreateModuleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Module</DialogTitle>
        </DialogHeader>
        {/* <CreateModuleForm>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" type="reset">
                Cancel
              </Button>
            </DialogClose>
            <Button>Create</Button>
          </DialogFooter>
        </CreateModuleForm> */}
      </DialogContent>
    </Dialog>
  );
}
