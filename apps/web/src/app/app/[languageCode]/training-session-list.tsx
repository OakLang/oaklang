"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  EditIcon,
  FilterIcon,
  LanguagesIcon,
  LibraryBigIcon,
  MoreHorizontal,
  PackageOpenIcon,
  SlidersIcon,
  SortDescIcon,
  TrashIcon,
} from "lucide-react";
import { toast } from "sonner";

import { ALL_EXERCISES } from "@acme/core/constants";

import type { SessionsListDisplay } from "~/store/app-store";
import type { RouterOutputs } from "~/trpc/react";
import type { LanguageCodeParams } from "~/types";
import RenderInfiniteQueryResult from "~/components/RenderInfiniteQueryResult";
import SearchBar from "~/components/SearchBar";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { useAppStore } from "~/store/app-store";
import { api } from "~/trpc/react";
import { cn } from "~/utils";
import { unimplementedToast } from "~/utils/helpers";
import StartLearningButton from "./start-learning-button";

export default function TrainingSessionList() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search");

  const { languageCode } = useParams<LanguageCodeParams>();
  const exercises = useAppStore((state) => state.sessionsListFilter.exercises);
  const orderBy = useAppStore((state) => state.sessionsListDisplay.orderBy);

  const trainingSessionsQuery =
    api.trainingSessions.getTrainingSessions.useInfiniteQuery(
      { languageCode, search, exercises, orderBy },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Sessions</h2>
      </div>
      <div className="flex justify-between gap-2 max-md:flex-col md:items-center">
        <div className="flex items-center gap-2">
          <FilterButton />
          <DisplayButton />
        </div>
        <div className="flex items-center gap-2">
          <SearchBar className="w-full flex-1 md:w-64" />
          <StartLearningButton />
        </div>
      </div>

      <RenderInfiniteQueryResult
        query={trainingSessionsQuery}
        renderLoading={() => (
          <div className="grid gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        )}
      >
        {({ data: { pages } }) => {
          if (pages[0]?.list.length === 0) {
            if (search ?? exercises.length > 0) {
              return (
                <div className="rounded-lg border py-16">
                  <div className="mx-auto max-w-lg px-4">
                    <div className="bg-secondary text-muted-foreground mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                      <PackageOpenIcon />
                    </div>
                    <p className="mt-4 text-center font-semibold">
                      No sessions found
                    </p>
                    <p className="text-muted-foreground mt-2 text-center text-sm">
                      Oh no! The session you are looking for does not exist. You
                      either typed in the wrong URL or don't have access to this
                      session.
                    </p>
                  </div>
                </div>
              );
            }
            return (
              <div className="rounded-lg border py-16">
                <div className="mx-auto max-w-lg px-4">
                  <p className="text-center font-semibold">No sessions found</p>
                  <p className="text-muted-foreground mt-2 text-center text-sm">
                    Start learing by creating a new session. Click on the start
                    learing button below to start your first session.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <StartLearningButton />
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div className="grid gap-4">
              {pages.map((page) =>
                page.list.map((item) => (
                  <SessionCard key={item.id} session={item} />
                )),
              )}
            </div>
          );
        }}
      </RenderInfiniteQueryResult>
    </div>
  );
}

function ToggleButton({
  checked,
  onCheckedChange,
  title,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  title: string;
}) {
  return (
    <Button
      onClick={() => onCheckedChange(!checked)}
      variant="ghost"
      size="sm"
      className={cn(
        "text-muted-foreground h-fit border border-transparent px-1.5 py-0.5",
        {
          "bg-accent text-accent-foreground border-border border": checked,
        },
      )}
    >
      {title}
    </Button>
  );
}

const orderingOptions: {
  value: SessionsListDisplay["orderBy"];
  label: string;
}[] = [
  {
    value: "createdAt",
    label: "Created At",
  },
  {
    value: "lastPracticedAt",
    label: "Last Practiced At",
  },
  {
    value: "title",
    label: "Title",
  },
];
function DisplayButton() {
  const sessionsListDisplay = useAppStore((state) => state.sessionsListDisplay);
  const setSessionsListDisplay = useAppStore(
    (state) => state.setSessionsListDisplay,
  );

  const handleChangeProperty = useCallback(
    (key: keyof SessionsListDisplay["properties"], value: boolean) => {
      setSessionsListDisplay({
        ...sessionsListDisplay,
        properties: {
          ...sessionsListDisplay.properties,
          [key]: value,
        },
      });
    },
    [sessionsListDisplay, setSessionsListDisplay],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <SlidersIcon className="-ml-1 mr-2 h-4 w-4" />
          Display
          <ChevronDownIcon className="-mr-1 ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit min-w-80 max-w-min">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="order-by">Ordering</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" id="order-by">
                <SortDescIcon className="-ml-1 mr-2 h-4 w-4" />
                {orderingOptions.find(
                  (item) => item.value === sessionsListDisplay.orderBy,
                )?.label ?? "Select ordering..."}
                <ChevronDownIcon className="-mr-1 ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup>
                {orderingOptions.map((item) => (
                  <DropdownMenuItem
                    key={item.value}
                    onClick={() =>
                      setSessionsListDisplay({
                        ...sessionsListDisplay,
                        orderBy: item.value,
                      })
                    }
                  >
                    <SortDescIcon className="mr-2 h-4 w-4" />
                    <span className="mr-2">{item.label}</span>
                    <CheckIcon
                      className={cn(
                        "ml-auto mr-2 h-4 w-4",
                        item.value === sessionsListDisplay.orderBy
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator orientation="horizontal" className="my-4" />

        <p className="text-muted-foreground text-xs uppercase">
          Display Properties
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <ToggleButton
            onCheckedChange={(value) => handleChangeProperty("title", !value)}
            checked={!sessionsListDisplay.properties.title}
            title="Id"
          />
          <ToggleButton
            onCheckedChange={(value) => handleChangeProperty("title", value)}
            checked={sessionsListDisplay.properties.title}
            title="Title"
          />
          <ToggleButton
            onCheckedChange={(value) => {
              setSessionsListDisplay({
                ...sessionsListDisplay,
                properties: {
                  ...sessionsListDisplay.properties,
                  createdAt: value,
                  lastPracticedAt: !value,
                },
              });
            }}
            checked={sessionsListDisplay.properties.createdAt}
            title="Created Date"
          />
          <ToggleButton
            onCheckedChange={(value) => {
              setSessionsListDisplay({
                ...sessionsListDisplay,
                properties: {
                  ...sessionsListDisplay.properties,
                  lastPracticedAt: value,
                  createdAt: !value,
                },
              });
            }}
            checked={sessionsListDisplay.properties.lastPracticedAt}
            title="Last Practiced Date"
          />
          <ToggleButton
            onCheckedChange={(value) => handleChangeProperty("language", value)}
            checked={sessionsListDisplay.properties.language}
            title="Language"
          />
          <ToggleButton
            onCheckedChange={(value) =>
              handleChangeProperty("knownWordsCounter", value)
            }
            checked={sessionsListDisplay.properties.knownWordsCounter}
            title="Known Words"
          />
          <ToggleButton
            onCheckedChange={(value) =>
              handleChangeProperty("newWordsCounter", value)
            }
            checked={sessionsListDisplay.properties.newWordsCounter}
            title="New Words"
          />
          <ToggleButton
            onCheckedChange={(value) => handleChangeProperty("progress", value)}
            checked={sessionsListDisplay.properties.progress}
            title="Progress"
          />
          <ToggleButton
            onCheckedChange={(value) => handleChangeProperty("exercise", value)}
            checked={sessionsListDisplay.properties.exercise}
            title="Exercise"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterButton() {
  const [open, setOpen] = useState(false);
  const [filterById, setFilterById] = useState("");
  const sessionsListFilter = useAppStore((state) => state.sessionsListFilter);
  const setSessionsListFilter = useAppStore(
    (state) => state.setSessionsListFilter,
  );

  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) {
          setFilterById("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline">
          <FilterIcon className="-ml-1 mr-2 h-4 w-4" />
          Filter
          <ChevronDownIcon className="-mr-1 ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        {filterById === "exercise" ? (
          <Command>
            <CommandInput placeholder="Search exercises..." />
            <CommandList>
              <CommandEmpty>No exercises found.</CommandEmpty>
              <CommandGroup>
                {ALL_EXERCISES.map((exercise) => {
                  const checked = sessionsListFilter.exercises.includes(
                    exercise.id,
                  );

                  return (
                    <CommandItem
                      key={exercise.id}
                      value={exercise.name}
                      onSelect={() => {
                        setSessionsListFilter({
                          ...sessionsListFilter,
                          exercises: checked
                            ? sessionsListFilter.exercises.filter(
                                (ex) => ex !== exercise.id,
                              )
                            : [...sessionsListFilter.exercises, exercise.id],
                        });
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          "mr-2 h-4 w-4",
                          checked ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {exercise.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        ) : (
          <Command>
            <CommandInput placeholder="Filter..." />
            <CommandList>
              <CommandEmpty>No matches.</CommandEmpty>
              <CommandGroup>
                {[{ value: "exercise", label: "Exercise" }].map((framework) => (
                  <CommandItem
                    key={framework.value}
                    value={framework.value}
                    onSelect={(currentValue) => {
                      setFilterById(
                        filterById === currentValue ? "" : currentValue,
                      );
                    }}
                  >
                    <LibraryBigIcon className="mr-2 h-4 w-4" />
                    {framework.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}

function SessionCard({
  session: item,
}: {
  session: RouterOutputs["trainingSessions"]["getTrainingSessions"]["list"][number];
}) {
  const sessionsListDisplay = useAppStore((state) => state.sessionsListDisplay);

  const utils = api.useUtils();
  const deleteTrainingSessionMut =
    api.trainingSessions.deleteTrainingSession.useMutation({
      onSuccess: (data) => {
        void utils.trainingSessions.getTrainingSessions.invalidate({
          languageCode: data.languageCode,
        });
        toast("Successfully deleted session!");
      },
      onError: (error) => {
        toast("Failed to delete session!", {
          description: error.message,
        });
      },
    });

  return (
    <div className="bg-card text-card-foreground hover:bg-secondary/50 group relative flex items-center gap-4 overflow-hidden rounded-lg border p-4 text-left shadow-sm transition-colors">
      <Link
        href={`/app/${item.languageCode}/training/${item.id}`}
        className="focus-visible:ring-ring ring-offset-background absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      />
      <div className="flex-1 overflow-hidden">
        {sessionsListDisplay.properties.title ? (
          <p className="line-clamp-2 font-medium">{item.title}</p>
        ) : (
          <div className="flex items-center gap-2 overflow-hidden">
            <p className="truncate font-medium">{item.id}</p>
            <Button
              onClick={() => window.navigator.clipboard.writeText(item.id)}
              size="icon"
              variant="outline"
              className="z-10 h-7 w-7 flex-shrink-0"
            >
              <CopyIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          {sessionsListDisplay.properties.createdAt && (
            <>
              <p className="text-muted-foreground text-sm max-md:hidden">
                Created{" "}
                {formatDistanceToNow(item.createdAt, {
                  addSuffix: true,
                })}
              </p>
              <p className="text-muted-foreground text-sm md:hidden">
                {formatDistanceToNow(item.createdAt, {
                  addSuffix: false,
                })}
              </p>
            </>
          )}
          {sessionsListDisplay.properties.lastPracticedAt && (
            <>
              <p className="text-muted-foreground text-sm max-md:hidden">
                {item.lastPracticedAt ? "Practiced" : "Created"}{" "}
                {formatDistanceToNow(item.lastPracticedAt ?? item.createdAt, {
                  addSuffix: true,
                })}
              </p>
              <p className="text-muted-foreground text-sm md:hidden">
                {formatDistanceToNow(item.lastPracticedAt ?? item.createdAt, {
                  addSuffix: false,
                })}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {sessionsListDisplay.properties.exercise && (
          <div className="text-muted-foreground flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-sm max-lg:hidden">
            {item.exercise?.name ?? "Unknown Exercise"}
          </div>
        )}
        {sessionsListDisplay.properties.newWordsCounter && (
          <div className="text-muted-foreground flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-sm">
            <span className="text-xs max-md:hidden">New Words</span>
            <span className="text-xs md:hidden">NW</span>
            {item.newWordsCount}
          </div>
        )}
        {sessionsListDisplay.properties.knownWordsCounter && (
          <div className="text-muted-foreground flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-sm">
            <span className="text-xs max-md:hidden">Known Words</span>
            <span className="text-xs md:hidden">KW</span>
            {item.knownWordsCount}
          </div>
        )}
        {sessionsListDisplay.properties.language && (
          <div className="text-muted-foreground flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-sm">
            <LanguagesIcon className="h-4 w-4" />
            <span className="max-md:hidden">{item.language.name}</span>
            <span className="md:hidden">{item.language.code}</span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="z-10 group-hover:border"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom">
            <DropdownMenuItem
              onClick={() => {
                unimplementedToast();
              }}
            >
              <EditIcon className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                unimplementedToast();
              }}
            >
              <CopyIcon className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                deleteTrainingSessionMut.mutate({
                  trainingSessionId: item.id,
                });
              }}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
