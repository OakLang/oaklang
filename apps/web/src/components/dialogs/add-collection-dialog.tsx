import { useCallback } from "react";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { LanguageCodeParams } from "~/types";
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
import { Textarea } from "../ui/textarea";

const schema = z.object({
  name: z
    .string({ message: "Name is required" })
    .min(1, "Name is required")
    .max(100),
  description: z.string().max(300).optional(),
});

type FormData = z.infer<typeof schema>;

export interface AddCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddCollectionDialog({
  onOpenChange,
  open,
}: AddCollectionDialogProps) {
  const { languageCode } = useParams<LanguageCodeParams>();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const utils = api.useUtils();

  const createCollectionMut = api.collections.createCollection.useMutation({
    onSuccess: () => {
      toast("Collection created");
      void utils.collections.getCollections.invalidate({ languageCode });
      form.reset();
      createCollectionMut.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast("Failed to create Collection", { description: error.message });
    },
  });

  const onSubmit = useCallback(
    (data: FormData) => {
      createCollectionMut.mutate({
        languageCode,
        name: data.name,
        description: data.description,
      });
    },
    [createCollectionMut, languageCode],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          form.reset();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Collection</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            onReset={() => form.reset()}
            className="grid gap-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Collection" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="reset" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                disabled={
                  createCollectionMut.isPending || createCollectionMut.isSuccess
                }
              >
                {createCollectionMut.isPending && (
                  <Loader2Icon className="-ml-1 mr-2 h-4 w-4" />
                )}
                Create Collection
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
