import type { DialogProps } from "@radix-ui/react-dialog";
import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { TrainingSession } from "@acme/db/schema";

import type { UseDialogHookValue } from "./types";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

const schema = z.object({
  title: z.string().min(1).max(300),
});

type FormData = z.infer<typeof schema>;

export type EditTrainingSessionDialogProps = DialogProps & {
  trainingSession: TrainingSession;
};

export default function EditTrainingSessionDialog({
  trainingSession,
  ...props
}: EditTrainingSessionDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: trainingSession.title,
    },
  });

  const utils = api.useUtils();
  const updateTrainingSession =
    api.trainingSessions.updateTrainingSession.useMutation({
      onSuccess: () => {
        void utils.trainingSessions.getTrainingSession.invalidate({
          trainingSessionId: trainingSession.id,
        });
        void utils.trainingSessions.getTrainingSessions.invalidate({
          languageCode: trainingSession.languageCode,
        });
        props.onOpenChange?.(false);
      },
    });

  const handleSubmit = useCallback(
    (data: FormData) => {
      updateTrainingSession.mutate({
        trainingSessionId: trainingSession.id,
        dto: { title: data.title },
      });
    },
    [trainingSession.id, updateTrainingSession],
  );

  useEffect(() => {
    form.resetField("title", { defaultValue: trainingSession.title });
  }, [form, trainingSession.title]);

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Training Session</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="grid gap-6"
            onSubmit={form.handleSubmit(handleSubmit)}
            onReset={() => form.reset()}
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Learning German" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary" type="reset">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={updateTrainingSession.isPending}>
                {updateTrainingSession.isPending && (
                  <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" />
                )}
                Update
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export const useEditTrainingSessionDialog =
  (): UseDialogHookValue<EditTrainingSessionDialogProps> => {
    const [open, setOpen] = useState(false);

    const Dialog = useCallback(
      (props: EditTrainingSessionDialogProps) => (
        <EditTrainingSessionDialog
          open={open}
          onOpenChange={setOpen}
          {...props}
        />
      ),
      [open],
    );

    return [Dialog, open, setOpen];
  };
