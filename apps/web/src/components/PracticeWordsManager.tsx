import type { CellContext, ColumnDef } from "@tanstack/react-table";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import type { RouterInputs, RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { formatDate } from "~/utils";
import { DataTable } from "./DataTable";
import { DataTableColumnHeader } from "./DataTableColumnHeader";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

type Word = RouterOutputs["words"]["getCurrentPracticeWords"][number];

const getDateColumCell = (props: CellContext<Word, unknown>) => {
  const value = props.getValue() as Date | null;
  if (value) {
    return formatDate(value);
  }
  return "-";
};

const WordActionButton = ({ word }: { word: Word }) => {
  const utils = api.useUtils();
  const markKnownMut = api.words.markWordKnown.useMutation({
    onSuccess: () => {
      void utils.words.getAllWords.invalidate({
        languageCode: word.languageCode,
      });
    },
    onError: (error) => toast(error.message),
  });
  const deleteWordMut = api.words.deleteKnown.useMutation({
    onSuccess: () => {
      void utils.words.getAllWords.invalidate({
        languageCode: word.languageCode,
      });
    },
    onError: (error) => toast(error.message),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline" className="-my-2 h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => markKnownMut.mutate({ wordId: word.wordId })}
          disabled={!!word.knownAt}
        >
          Mark Known
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => deleteWordMut.mutate({ wordId: word.wordId })}
        >
          Delete Word
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columns: ColumnDef<Word>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "word",
    header: (props) => (
      <DataTableColumnHeader column={props.column} title="Word" />
    ),
  },
  {
    accessorKey: "createdAt",
    cell: getDateColumCell,
    header: (props) => (
      <DataTableColumnHeader column={props.column} title="Created At" />
    ),
  },
  {
    accessorKey: "spacedRepetitionStage",
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title="Spaced Repetition Stage"
      />
    ),
  },
  {
    accessorKey: "seenCount",
    header: (props) => (
      <DataTableColumnHeader column={props.column} title="Seen Count" />
    ),
  },
  {
    accessorKey: "practiceCount",
    header: (props) => (
      <DataTableColumnHeader column={props.column} title="Practice Count" />
    ),
  },
  {
    accessorKey: "nextPracticeAt",
    header: (props) => (
      <DataTableColumnHeader column={props.column} title="Next Practice" />
    ),
    cell: getDateColumCell,
  },
  {
    accessorKey: "knownAt",
    header: (props) => (
      <DataTableColumnHeader column={props.column} title="Known At" />
    ),
    cell: getDateColumCell,
  },
  {
    accessorKey: "lastSeenAt",
    header: (props) => (
      <DataTableColumnHeader column={props.column} title="Last Seen At" />
    ),
    cell: getDateColumCell,
  },
  {
    accessorKey: "lastPracticedAt",
    header: (props) => (
      <DataTableColumnHeader column={props.column} title="Last Practiced At" />
    ),
    cell: getDateColumCell,
  },
  {
    accessorKey: "seenCountSinceLastPracticed",
    header: (props) => {
      return (
        <DataTableColumnHeader
          column={props.column}
          title="Seen Count Since Last Practiced"
        />
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <WordActionButton word={row.original} />,
  },
];

export default function PracticeWordsManager() {
  const { practiceLanguage } = useParams<{ practiceLanguage: string }>();
  const [filter, setFilter] =
    useState<RouterInputs["words"]["getAllWords"]["filter"]>("all");
  const allWords = api.words.getAllWords.useQuery({
    languageCode: practiceLanguage,
    filter,
  });

  return (
    <section id="practice-words" className="my-8">
      <div className="mb-4">
        <h2 className="text-xl font-medium">Words List</h2>
      </div>
      {allWords.isError ? (
        <p>{allWords.error.message}</p>
      ) : (
        <DataTable
          columns={columns}
          data={allWords.data ?? []}
          isLoading={allWords.isPending}
          filterColumn="word"
          renderActions={() => (
            <>
              <Tabs value={filter}>
                <TabsList>
                  <TabsTrigger onClick={() => setFilter("all")} value="all">
                    All
                  </TabsTrigger>
                  <TabsTrigger onClick={() => setFilter("known")} value="known">
                    Known
                  </TabsTrigger>
                  <TabsTrigger
                    onClick={() => setFilter("unknown")}
                    value="unknown"
                  >
                    Unknown
                  </TabsTrigger>
                  <TabsTrigger
                    onClick={() => setFilter("practicing")}
                    value="practicing"
                  >
                    Practicing
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </>
          )}
        />
      )}
    </section>
  );
}
