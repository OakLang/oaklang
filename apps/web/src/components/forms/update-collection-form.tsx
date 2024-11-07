"use client";

import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { Collection } from "@acme/db/schema";

import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { FieldRequiredIndecator } from "../ui/label";
import { Textarea } from "../ui/textarea";

const schema = z.object({
  name: z
    .string({ message: "Name is required" })
    .min(1, "Name is required")
    .max(100)
    .optional(),
  description: z.string().max(300).optional(),
});

type FormData = z.infer<typeof schema>;

export interface UpdateCollectionFormProps {
  onUpdated?: (collection: Collection) => void;
  children?: (props: {
    form: UseFormReturn<FormData>;
    isLoading?: boolean;
  }) => ReactNode;
  collection: Collection;
}

export default function UpdateCollectionForm({
  children,
  onUpdated,
  collection,
}: UpdateCollectionFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: collection.name,
      description: collection.description ?? "",
    },
  });

  const updateCollectionMut = api.collections.updateCollection.useMutation({
    onSuccess: (data) => {
      onUpdated?.(data);
    },
    onError: (error) => {
      toast("Failed to update Collection", { description: error.message });
    },
  });

  const onSubmit = useCallback(
    (data: FormData) => {
      updateCollectionMut.mutate({
        collectionId: collection.id,
        name: data.name,
        description: data.description,
      });
    },
    [collection.id, updateCollectionMut],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Name
                <FieldRequiredIndecator />
              </FormLabel>
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

        {children?.({ form, isLoading: updateCollectionMut.isPending }) ?? (
          <Button disabled={updateCollectionMut.isPending}>
            {updateCollectionMut.isPending && (
              <Loader2Icon className="-ml-1 mr-2 h-4 w-4" />
            )}
            Update Collection
          </Button>
        )}
      </form>
    </Form>
  );
}
