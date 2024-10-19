"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  MoreHorizontal,
  PlusIcon,
} from "lucide-react";
import { toast } from "sonner";

import type { Collection, Module } from "@acme/db/schema";
import { Exercises } from "@acme/core/constants";

import type { LanguageCodeParams } from "~/types";
import AddCollectionDialog from "~/components/dialogs/add-collection-dialog";
import RenderInfiniteQueryResult from "~/components/RenderInfiniteQueryResult";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Skeleton } from "~/components/ui/skeleton";
import { useAppStore } from "~/store/app-store";
import { api } from "~/trpc/react";

export default function CollectionsList() {
  const [showAddCollectionDialog, setShowAddCollectionDialog] = useState(false);
  const { languageCode } = useParams<LanguageCodeParams>();
  const collectionsQuery = api.collections.getCollections.useInfiniteQuery(
    { languageCode },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">Collections</p>
        <Button
          variant="outline"
          onClick={() => setShowAddCollectionDialog(true)}
        >
          <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
          Add Collection
        </Button>
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
              <p className="text-muted-foreground text-sm">
                You haven't created any collection yet!
              </p>
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

      <AddCollectionDialog
        open={showAddCollectionDialog}
        onOpenChange={setShowAddCollectionDialog}
      />
    </div>
  );
}

const CollectionItem = ({ collection }: { collection: Collection }) => {
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
                deleteCollectionMut.mutate({
                  collectionId: collection.id,
                });
              }}
            >
              Delete Collection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {!isCollapced && <ModulesRow collectionId={collection.id} />}
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
  const renderDetails = useMemo(() => {
    switch (module.jsonData.type) {
      case "exercise-1":
        return (
          <div className="grid gap-1">
            <p className="text-muted-foreground line-clamp-2 text-sm">
              Topic: {module.jsonData.topic ? module.jsonData.topic : "-"}
            </p>
            <p className="text-muted-foreground text-sm">
              Complexity:{" "}
              {module.jsonData.complexity ? module.jsonData.complexity : "-"}
            </p>
            <p className="text-muted-foreground text-sm">
              Words: {module.jsonData.words?.length ?? 0}
            </p>
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
      switch (module.jsonData.type) {
        case Exercises.exercies1: {
          const session = await createTrainingSession.mutateAsync({
            languageCode: module.languageCode,
            title: module.name,
            exercise: Exercises.exercies1,
            data: {
              complexity: module.jsonData.complexity ?? "A1",
              topic: module.jsonData.topic ?? "",
              words: module.jsonData.words ?? [],
            },
          });

          void utils.trainingSessions.getTrainingSessions.invalidate({
            languageCode: session.languageCode,
          });
          router.push(`/app/${session.languageCode}/training/${session.id}`);
          break;
        }

        default:
          break;
      }
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
              deleteModuleMut.mutate({
                moduleId: module.id,
              });
            }}
          >
            Delete Module
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
