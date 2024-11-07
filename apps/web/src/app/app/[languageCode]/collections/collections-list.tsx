"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  EditIcon,
  MoreHorizontal,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import { toast } from "sonner";

import type { Collection, Module } from "@acme/db/schema";
import { Exercise1, Exercise2, Exercise3 } from "@acme/core/constants";

import { useCreateCollectionDialog } from "~/components/dialogs/create-collection-dialog";
import { useCreateModuleDialog } from "~/components/dialogs/create-module-dialog";
import { useUpdateCollectionDialog } from "~/components/dialogs/update-collection-dialog";
import { useUpdateModuleDialog } from "~/components/dialogs/update-module-dialog";
import RenderInfiniteQueryResult from "~/components/RenderInfiniteQueryResult";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Skeleton } from "~/components/ui/skeleton";
import { usePracticeLanguage } from "~/providers/practice-language-provider";
import { useAppStore } from "~/store/app-store";
import { api } from "~/trpc/react";

export default function CollectionsList() {
  const [CreateCollectionDialog, _, setCreateCollectionDialogOpen] =
    useCreateCollectionDialog();

  const { language } = usePracticeLanguage();
  const collectionsQuery = api.collections.getCollections.useInfiniteQuery(
    { languageCode: language.code },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Collections</h2>
      </div>
      <div className="flex gap-2 max-md:flex-col md:items-center">
        <div className="flex items-center gap-2">
          {/* <FilterButton />
        <DisplayButton /> */}
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <Button onClick={() => setCreateCollectionDialogOpen(true)}>
            <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
            Create Collection
          </Button>
        </div>
      </div>

      <RenderInfiniteQueryResult
        query={collectionsQuery}
        renderLoading={() => (
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            </div>
          </div>
        )}
      >
        {({ data: { pages } }) => {
          if ((pages[0]?.list.length ?? 0) === 0) {
            return (
              <div className="rounded-lg border py-16">
                <div className="mx-auto max-w-lg px-4">
                  <p className="text-center font-semibold">
                    No collections found
                  </p>
                  <p className="text-muted-foreground mt-2 text-center text-sm">
                    You haven’t created any collections yet. Start organizing
                    your modules by clicking the "Create Collection" button
                    below to add your first one.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <Button onClick={() => setCreateCollectionDialogOpen(true)}>
                      <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
                      Create Collection
                    </Button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              {pages.map((page) =>
                page.list.map((collection) => (
                  <CollectionItem collection={collection} key={collection.id} />
                )),
              )}
            </div>
          );
        }}
      </RenderInfiniteQueryResult>

      <CreateCollectionDialog
        onCreated={() => {
          toast("Collection created");
          void collectionsQuery.refetch();
          setCreateCollectionDialogOpen(false);
        }}
      />
    </div>
  );
}

const CollectionItem = ({ collection }: { collection: Collection }) => {
  const [CreateModuleDialog, , setCreateModuleDialogOpen] =
    useCreateModuleDialog();
  const [UpdateCollectionDialog, , setUpdateCollectionDialogOpen] =
    useUpdateCollectionDialog();

  const isCollapced = useAppStore(
    (state) => state.collectionsCollapced[collection.id] ?? false,
  );
  const collapceCollection = useAppStore((state) => state.collapceCollection);
  const expandCollection = useAppStore((state) => state.expandCollection);

  const utils = api.useUtils();

  const deleteCollectionMut = api.collections.deleteCollection.useMutation({
    onSuccess: () => {
      void utils.collections.getCollections.invalidate({
        languageCode: collection.languageCode,
      });
      toast("Collection deleted");
    },
    onError: (error) => {
      toast("Failed to delete collection!", {
        description: error.message,
      });
    },
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <Button
          variant="ghost"
          onClick={() => {
            if (isCollapced) {
              expandCollection(collection.id);
            } else {
              collapceCollection(collection.id);
            }
          }}
          className="h-8 px-3"
        >
          {isCollapced ? (
            <ChevronRightIcon className="-ml-1 mr-2 h-4 w-4" />
          ) : (
            <ChevronDownIcon className="-ml-1 mr-2 h-4 w-4" />
          )}
          {collection.name}
        </Button>
        <div className="flex-1"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="outline" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom">
            <DropdownMenuItem
              onClick={() => {
                setUpdateCollectionDialogOpen(true);
              }}
            >
              <EditIcon className="mr-2 h-4 w-4" />
              Edit Collection
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setCreateModuleDialogOpen(true);
              }}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Module
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                deleteCollectionMut.mutate({
                  collectionId: collection.id,
                });
              }}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete Collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!isCollapced && <ModulesRow collectionId={collection.id} />}

      <CreateModuleDialog
        collectionId={collection.id}
        onCreated={() => {
          toast("Module created");
          void utils.modules.getModules.invalidate({
            collectionId: collection.id,
          });
          setCreateModuleDialogOpen(false);
        }}
      />

      <UpdateCollectionDialog
        collection={collection}
        onUpdated={() => {
          setUpdateCollectionDialogOpen(false);
          toast("Collection updated");
          void utils.collections.getCollections.invalidate({
            languageCode: collection.languageCode,
          });
        }}
      />
    </div>
  );
};

const ModulesRow = ({ collectionId }: { collectionId: string }) => {
  const modulesQuery = api.modules.getModules.useInfiniteQuery(
    { collectionId, limit: 6 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );
  return (
    <RenderInfiniteQueryResult
      query={modulesQuery}
      renderLoading={() => (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      )}
    >
      {(query) => {
        if ((query.data.pages[0]?.list.length ?? 0) === 0) {
          return (
            <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground">No modules</p>
            </div>
          );
        }
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {query.data.pages.map((page) =>
              page.list.map((module) => (
                <ModuleCard module={module} key={module.id} />
              )),
            )}
          </div>
        );
      }}
    </RenderInfiniteQueryResult>
  );
};

const ModuleCard = ({ module }: { module: Module }) => {
  const [UpdateModuleDialog, , setUpdateModuleDialogOpen] =
    useUpdateModuleDialog();

  const renderDetails = useMemo(() => {
    switch (module.jsonData.exercise) {
      case "exercise-1":
        return (
          <div className="grid gap-1">
            <p className="text-muted-foreground line-clamp-2 text-sm">
              Exercise: {Exercise1.name}
            </p>
            <p className="text-muted-foreground line-clamp-2 text-sm">
              Topic: {module.jsonData.data.topic}
            </p>
            <p className="text-muted-foreground text-sm">
              Complexity: {module.jsonData.data.complexity}
            </p>
            <p className="text-muted-foreground line-clamp-2 text-sm">
              Words: {module.jsonData.data.words?.join(", ")}
            </p>
          </div>
        );
      case "exercise-2":
        return (
          <div className="grid gap-1">
            <p className="text-muted-foreground line-clamp-2 text-sm">
              Exercise: {Exercise2.name}
            </p>
            <p className="text-muted-foreground text-sm">
              Learn from: {module.jsonData.data.learnFrom}
            </p>
            {module.jsonData.data.learnFrom === "list-of-words" && (
              <>
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  Words: {module.jsonData.data.words.join(", ")}
                </p>
                <p className="text-muted-foreground text-sm">
                  Each word practice count:{" "}
                  {module.jsonData.data.eachWordPracticeCount}
                </p>
                <p className="text-muted-foreground text-sm">
                  Complexity: {module.jsonData.data.complexity}
                </p>
              </>
            )}
            {module.jsonData.data.learnFrom === "number-of-sentences" && (
              <>
                <p className="text-muted-foreground text-sm">
                  Number of Sentences: {module.jsonData.data.numberOfSentences}
                </p>
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  Topic: {module.jsonData.data.topic}
                </p>
                <p className="text-muted-foreground text-sm">
                  Complexity: {module.jsonData.data.complexity}
                </p>
              </>
            )}
            {module.jsonData.data.learnFrom === "number-of-words" && (
              <>
                <p className="text-muted-foreground text-sm">
                  Number of Words: {module.jsonData.data.numberOfWords}
                </p>
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  Topic: {module.jsonData.data.topic}
                </p>
                <p className="text-muted-foreground text-sm">
                  Complexity: {module.jsonData.data.complexity}
                </p>
              </>
            )}
          </div>
        );
      case "exercise-3":
        return (
          <div className="grid gap-1">
            <p className="text-muted-foreground line-clamp-2 text-sm">
              Exercise: {Exercise3.name}
            </p>
            <p className="text-muted-foreground text-sm">
              Learn from: {module.jsonData.data.learnFrom}
            </p>
            {module.jsonData.data.learnFrom === "ask-ai" && (
              <>
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  Topic: {module.jsonData.data.topic}
                </p>
                <p className="text-muted-foreground text-sm">
                  Complexity: {module.jsonData.data.complexity}
                </p>
              </>
            )}
            {module.jsonData.data.learnFrom === "content" && (
              <>
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  Content: {module.jsonData.data.content}
                </p>
              </>
            )}
          </div>
        );

      default:
        return <></>;
    }
  }, [module]);
  const [isLoading, setIsLoading] = useState(false);

  const utils = api.useUtils();
  const createTrainingSession =
    api.trainingSessions.createTrainingSession.useMutation();
  const deleteModuleMut = api.modules.deleteModule.useMutation({
    onSuccess: () => {
      void utils.modules.getModules.invalidate({
        collectionId: module.collectionId,
      });
      toast("Module deleted");
    },
    onError: (error) => {
      toast("Failed to delete module!", {
        description: error.message,
      });
    },
  });

  const router = useRouter();

  const handleModuleClick = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = await createTrainingSession.mutateAsync({
        languageCode: module.languageCode,
        title: module.name,
        exercise: module.jsonData,
      });

      void utils.trainingSessions.getTrainingSessions.invalidate({
        languageCode: session.languageCode,
      });
      router.push(`/app/${session.languageCode}/training/${session.id}`);
    } catch (error) {
      toast((error as { message?: string }).message ?? "Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  }, [
    createTrainingSession,
    module,
    router,
    utils.trainingSessions.getTrainingSessions,
  ]);

  return (
    <div className="relative">
      <button
        className="ring-offset-background focus-visible:ring-ring bg-card text-card-foreground hover:bg-accent/50 hover:text-accent-foreground flex w-full flex-shrink-0 flex-col rounded-lg border p-4 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 md:p-6"
        onClick={handleModuleClick}
        disabled={isLoading}
      >
        <p className="font-semibold">{module.name}</p>
        {!!module.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {module.description}
          </p>
        )}
        <div className="mt-2">{renderDetails}</div>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="absolute right-2 top-2 h-8 w-8"
            size="icon"
            variant="ghost"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom">
          <DropdownMenuItem
            onClick={() => {
              setUpdateModuleDialogOpen(true);
            }}
          >
            <EditIcon className="mr-2 h-4 w-4" />
            Edit Module
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              deleteModuleMut.mutate({
                moduleId: module.id,
              });
            }}
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete Module
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UpdateModuleDialog
        module={module}
        onUpdated={(updatedModule) => {
          void utils.modules.getModules.invalidate({
            collectionId: module.collectionId,
          });
          if (updatedModule.collectionId !== module.collectionId) {
            void utils.modules.getModules.invalidate({
              collectionId: updatedModule.collectionId,
            });
          }
          setUpdateModuleDialogOpen(false);
          toast("Module updated");
        }}
      />
    </div>
  );
};
