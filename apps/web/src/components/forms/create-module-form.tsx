"uee client";

import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useCallback } from "react";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { ModuleData } from "@acme/core/validators";

import type { LanguageCodeParams } from "~/types";
import { api } from "~/trpc/react";
import InfoTable from "../InfoTable";
import RenderInfiniteQueryResult from "../RenderInfiniteQueryResult";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

const schema = z.object({
  name: z.string().min(1).max(100),
  collectionId: z.string(),
  description: z.string(),
});

type FormData = z.infer<typeof schema>;

export interface CreateModuleFormProps {
  children?: (props: {
    form: UseFormReturn<FormData>;
    isLoading?: boolean;
  }) => ReactNode;
  data: ModuleData;
  onSuccess?: () => void;
  defaultName?: string;
  defaultDescription?: string;
}

export default function CreateModuleForm({
  children,
  data,
  onSuccess,
  defaultDescription,
  defaultName,
}: CreateModuleFormProps) {
  const { languageCode } = useParams<LanguageCodeParams>();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultName ?? "",
      description: defaultDescription ?? "",
      collectionId: undefined,
    },
  });
  const collectionsQuery = api.collections.getCollections.useInfiniteQuery(
    { languageCode },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const utils = api.useUtils();
  const createModuleMut = api.modules.createModule.useMutation({
    onSuccess: (_, vars) => {
      onSuccess?.();
      void utils.modules.getModules.invalidate({
        collectionId: vars.collectionId,
      });
    },
    onError: (error) => {
      toast("Failed to create module", {
        description: error.message,
      });
    },
  });

  const handleSubmit = useCallback(
    ({ description, name, collectionId }: FormData) => {
      createModuleMut.mutate({
        collectionId,
        data,
        languageCode,
        name,
        description,
      });
    },
    [createModuleMut, data, languageCode],
  );

  return (
    <Form {...form}>
      <form className="grid gap-6" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collection</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    form.setValue(field.name, value, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a collection" />
                  </SelectTrigger>
                  <SelectContent>
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
                            <SelectItem
                              key={collection.id}
                              value={collection.id}
                            >
                              {collection.name}
                            </SelectItem>
                          )),
                        );
                      }}
                    </RenderInfiniteQueryResult>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <p className="text-sm font-semibold">Data</p>
          <InfoTable
            data={
              data.type === "exercise-1"
                ? [
                    {
                      label: "Topic",
                      value: data.topic ?? "-",
                    },
                    {
                      label: "Complexity",
                      value: data.complexity ?? "-",
                    },
                    {
                      label: "Words",
                      value:
                        data.words && data.words.length > 0
                          ? data.words.join(", ")
                          : "-",
                    },
                  ]
                : []
            }
          />
        </div>
        {children?.({ form, isLoading: createModuleMut.isPending }) ?? (
          <Button
            disabled={createModuleMut.isPending || !form.formState.isValid}
          >
            Create Module
          </Button>
        )}
      </form>
    </Form>
  );
}
