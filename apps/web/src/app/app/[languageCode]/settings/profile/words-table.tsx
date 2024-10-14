"use client";

import type { CellContext, ColumnDef } from "@tanstack/react-table";
import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { CheckIcon, MoreHorizontal, XIcon } from "lucide-react";
import pluralize from "pluralize";
import { toast } from "sonner";

import type { UserWordWithWord } from "@acme/api/validators";

import type { RouterInputs } from "~/trpc/react";
import type { LanguageCodeParams } from "~/types";
import { DataTable } from "~/components/DataTable";
import { DataTableColumnHeader } from "~/components/DataTableColumnHeader";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";
import { formatDate } from "~/utils";

const getDateColumCell = (props: CellContext<UserWordWithWord, unknown>) => {
  const value = props.getValue() as Date | null;
  if (value) {
    return formatDate(value);
  }
  return "-";
};
const getBooleanColumnCell = (
  props: CellContext<UserWordWithWord, unknown>,
) => {
  const value = props.getValue() as boolean | null;
  if (value !== null) {
    return value ? (
      <CheckIcon className="h-4 w-4" />
    ) : (
      <XIcon className="h-4 w-4" />
    );
  }
  return "-";
};

function WordActionButton({ word }: { word: UserWordWithWord }) {
  const utils = api.useUtils();
  const { languageCode } = useParams<LanguageCodeParams>();

  const markKnownMut = api.words.markWordKnown.useMutation({
    onSuccess: () => {
      void utils.words.getAllWords.invalidate({
        languageCode,
      });
      void utils.languages.getPracticeLanguage.invalidate({
        languageCode,
      });
      void utils.languages.getPracticeLanguages.invalidate();
    },
    onError: (error) => toast(error.message),
  });

  const markUnknownMut = api.words.markWordUnknown.useMutation({
    onSuccess: () => {
      void utils.words.getAllWords.invalidate({
        languageCode,
      });
      void utils.languages.getPracticeLanguage.invalidate({
        languageCode,
      });
      void utils.languages.getPracticeLanguages.invalidate();
    },
    onError: (error) => toast(error.message),
  });

  const deleteUserWordMut = api.words.deleteUserWord.useMutation({
    onSuccess: () => {
      void utils.words.getAllWords.invalidate({
        languageCode,
      });
      void utils.languages.getPracticeLanguage.invalidate({
        languageCode,
      });
      void utils.languages.getPracticeLanguages.invalidate();
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
        {word.knownAt ? (
          <DropdownMenuItem
            onClick={() => markUnknownMut.mutate({ wordId: word.wordId })}
          >
            Mark Unknown
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() =>
              markKnownMut.mutate({ wordId: word.wordId, sessionId: null })
            }
          >
            Mark Known
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => deleteUserWordMut.mutate({ wordId: word.wordId })}
        >
          Delete Word
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columns: ColumnDef<UserWordWithWord>[] = [
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
        className="my-auto"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 48,
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
    accessorKey: "hideLines",
    header: (props) => {
      return <DataTableColumnHeader column={props.column} title="Hide Lines" />;
    },
    cell: getBooleanColumnCell,
  },
  {
    accessorKey: "lastDissabledHideLinesAt",
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title="Last Dissabled Hide Lines At"
      />
    ),
    cell: getDateColumCell,
  },
  {
    accessorKey: "dissableHideLinesCount",
    header: (props) => {
      return (
        <DataTableColumnHeader
          column={props.column}
          title="Dissable Hide Lines Count"
        />
      );
    },
  },
  {
    accessorKey: "lastMarkedUnknownAt",
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title="Last Marked Unknown At"
      />
    ),
    cell: getDateColumCell,
  },
  {
    accessorKey: "markedUnknownCount",
    header: (props) => {
      return (
        <DataTableColumnHeader
          column={props.column}
          title="Marked Unknown Count"
        />
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <WordActionButton word={row.original} />,
    size: 48,
  },
];

export default function WardsTable({ languageCode }: { languageCode: string }) {
  const [filter, setFilter] =
    useState<RouterInputs["words"]["getAllWords"]["filter"]>("all");

  const allWords = api.words.getAllWords.useQuery({
    languageCode,
    filter,
  });

  const utils = api.useUtils();

  const markWordKnownMutation = api.words.markWordKnown.useMutation();
  const deleteUserWordMut = api.words.deleteUserWord.useMutation();

  const handleMarkSelectedWordsKnown = useCallback(
    async (wordIds: string[]) => {
      await Promise.all(
        wordIds.map((wordId) =>
          markWordKnownMutation.mutateAsync({ wordId, sessionId: null }),
        ),
      );
      void allWords.refetch();
      void utils.languages.getPracticeLanguage.invalidate({
        languageCode: languageCode,
      });
      void utils.languages.getPracticeLanguages.invalidate();
    },
    [
      allWords,
      markWordKnownMutation,
      languageCode,
      utils.languages.getPracticeLanguage,
      utils.languages.getPracticeLanguages,
    ],
  );

  const handleDeleteSelectedWords = useCallback(
    async (wordIds: string[]) => {
      await Promise.all(
        wordIds.map((wordId) => deleteUserWordMut.mutateAsync({ wordId })),
      );
      void allWords.refetch();
      void utils.languages.getPracticeLanguage.invalidate({
        languageCode: languageCode,
      });
      void utils.languages.getPracticeLanguages.invalidate();
    },
    [
      allWords,
      deleteUserWordMut,
      languageCode,
      utils.languages.getPracticeLanguage,
      utils.languages.getPracticeLanguages,
    ],
  );

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
          filterPlaceholder="Filter words..."
          persistKeyPrefix="words-data-table"
          getRowId={(row) => row.wordId}
          renderActions={({ table }) => (
            <>
              <Tabs value={filter}>
                <TabsList>
                  <TabsTrigger
                    onClick={() => {
                      setFilter("all");
                      table.setRowSelection({});
                    }}
                    value="all"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    onClick={() => {
                      setFilter("known");
                      table.setRowSelection({});
                    }}
                    value="known"
                  >
                    Known
                  </TabsTrigger>
                  <TabsTrigger
                    onClick={() => {
                      setFilter("unknown");
                      table.setRowSelection({});
                    }}
                    value="unknown"
                  >
                    Unknown
                  </TabsTrigger>
                  <TabsTrigger
                    onClick={() => {
                      setFilter("practicing");
                      table.setRowSelection({});
                    }}
                    value="practicing"
                  >
                    Practicing
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </>
          )}
          initialState={{
            columnPinning: {
              left: ["select", "word"],
              right: ["actions"],
            },
          }}
          renderRowSelectionActios={({ table }) => {
            const selectedWordIds = table
              .getSelectedRowModel()
              .rows.map((row) => row.original.wordId);
            return (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  disabled={deleteUserWordMut.isPending}
                  onClick={async () => {
                    await handleDeleteSelectedWords(selectedWordIds);
                    table.setRowSelection({});
                  }}
                >
                  Delete {selectedWordIds.length}{" "}
                  {pluralize("Word", selectedWordIds.length)}
                </Button>
                <Button
                  variant="outline"
                  disabled={markWordKnownMutation.isPending}
                  onClick={async () => {
                    await handleMarkSelectedWordsKnown(selectedWordIds);
                    table.setRowSelection({});
                  }}
                >
                  Mark {selectedWordIds.length}{" "}
                  {pluralize("Word", selectedWordIds.length)} Known
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    table.setRowSelection({});
                  }}
                >
                  Deselect All
                </Button>
              </div>
            );
          }}
        />
      )}
    </section>
  );
}
