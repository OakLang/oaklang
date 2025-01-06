"uee client";

import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { ExerciseFormData } from "@acme/core/validators";
import type { Module } from "@acme/db/schema";
import { exerciseSchema } from "@acme/core/validators";

import { usePracticeLanguage } from "~/providers/practice-language-provider";
import { api } from "~/trpc/react";
import { cn } from "~/utils";
import { useCreateCollectionDialog } from "../dialogs/create-collection-dialog";
import RenderInfiniteQueryResult from "../RenderInfiniteQueryResult";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
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
import ExerciseDataForm from "./exercise-data-form";

const schema = z.object({
  name: z.string().min(1).max(100),
  collectionId: z.string(),
  description: z.string(),
  exercise: exerciseSchema,
});

type FormData = z.infer<typeof schema>;

export interface CreateModuleFormProps {
  name?: string;
  description?: string;
  collectionId?: string;
  exercise?: Partial<ExerciseFormData>;
  children?: (props: {
    form: UseFormReturn<FormData>;
    isLoading?: boolean;
  }) => ReactNode;
  onCreated?: (module: Module) => void;
}

export default function CreateModuleForm({
  children,
  exercise: data,
  description: defaultDescription,
  name: defaultName,
  onCreated,
  collectionId,
}: CreateModuleFormProps) {
  const [CreateCollectionDialog, , setCreateCollectionDialogOpen] =
    useCreateCollectionDialog();
  const { language } = usePracticeLanguage();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultName ?? "",
      description: defaultDescription ?? "",
      collectionId,
      exercise: data,
    },
  });
  const collectionsQuery = api.collections.getCollections.useInfiniteQuery(
    { languageCode: language.code },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const createModuleMut = api.modules.createModule.useMutation({
    onSuccess: (module) => {
      onCreated?.(module);
    },
    onError: (error) => {
      toast("Failed to create module", {
        description: error.message,
      });
    },
  });

  const handleSubmit = useCallback(
    ({ description, name, collectionId, exercise }: FormData) => {
      createModuleMut.mutate({
        collectionId,
        data: exercise,
        languageCode: language.code,
        name,
        description,
      });
    },
    [createModuleMut, language.code],
  );

  return (
    <Form {...form}>
      <form className="grid gap-6" onSubmit={form.handleSubmit(handleSubmit)}>
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
                <Input {...field} />
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

        <FormField
          control={form.control}
          name="collectionId"
          render={({ field }) => {
            const collection = collectionsQuery.data?.pages
              .flatMap((page) => page.list)
              .find((item) => item.id === field.value);

            return (
              <FormItem>
                <FormLabel>
                  Collection
                  <FieldRequiredIndecator />
                </FormLabel>
                <FormControl>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start gap-2 overflow-hidden text-left"
                      >
                        <span className="flex-1 truncate">
                          {collection?.name ?? field.value}
                        </span>
                        <ChevronsUpDownIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                      <RenderInfiniteQueryResult
                        query={collectionsQuery}
                        renderLoadMoreButton={(query) => (
                          <Button
                            onClick={() => query.fetchNextPage()}
                            disabled={query.isFetchingNextPage}
                            className="text-muted-foreground mt-1 h-8 w-full"
                            variant="outline"
                          >
                            Load More
                          </Button>
                        )}
                      >
                        {(query) => {
                          if ((query.data.pages[0]?.list.length ?? 0) === 0) {
                            return <p>No Collection</p>;
                          }
                          return query.data.pages.map((page) =>
                            page.list.map((collection) => (
                              <DropdownMenuItem
                                key={collection.id}
                                onClick={() => {
                                  form.setValue(field.name, collection.id, {
                                    shouldDirty: true,
                                  });
                                }}
                              >
                                <CheckIcon
                                  className={cn("mr-2 h-4 w-4 opacity-0", {
                                    "opacity-100":
                                      collection.id === field.value,
                                  })}
                                />
                                {collection.name}
                              </DropdownMenuItem>
                            )),
                          );
                        }}
                      </RenderInfiniteQueryResult>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setCreateCollectionDialogOpen(true)}
                      >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Create Collection
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <ExerciseDataForm
          form={
            form as unknown as UseFormReturn<{ exercise: ExerciseFormData }>
          }
        />

        {children?.({ form, isLoading: createModuleMut.isPending }) ?? (
          <Button
            disabled={createModuleMut.isPending || !form.formState.isValid}
          >
            Create Module
          </Button>
        )}
      </form>

      <CreateCollectionDialog
        onCreated={async (collection) => {
          await collectionsQuery.refetch();
          form.setValue("collectionId", collection.id, {
            shouldDirty: true,
          });
          setCreateCollectionDialogOpen(false);
          toast("Collection created");
        }}
      />
    </Form>
  );
}
