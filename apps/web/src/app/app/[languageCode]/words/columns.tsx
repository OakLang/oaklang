import type { ColumnDef } from "@tanstack/react-table";
import { useParams } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import type { UserWordWithWord } from "@acme/api/validators";

import type { LanguageCodeParams } from "~/types";
import { getBooleanColumnCell, getDateColumCell } from "~/components/DataTable";
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
import { api } from "~/trpc/react";

function WordActionButton({ word }: { word: UserWordWithWord }) {
  const utils = api.useUtils();
  const { languageCode } = useParams<LanguageCodeParams>();

  const markKnownMut = api.words.markWordKnown.useMutation({
    onSuccess: () => {
      void utils.words.getUserWords.invalidate({
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
      void utils.words.getUserWords.invalidate({
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
      void utils.words.getUserWords.invalidate({
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

export const COLUMN_TITLE: Record<string, string> = {
  word_word: "Word",
  word_id: "Word Id",
  createdAt: "Created At",
  spacedRepetitionStage: "Spaced Repetition Stage",
  seenCount: "Seen Count",
  practiceCount: "Practice Count",
  nextPracticeAt: "Next Practice",
  knownAt: "Known At",
  lastSeenAt: "Last Seen At",
  lastPracticedAt: "Last Practiced At",
  seenCountSinceLastPracticed: "Seen Count Since Last Practiced",
  hideLines: "Hide Lines",
  lastDissabledHideLinesAt: "Last Dissabled Hide Lines At",
  dissableHideLinesCount: "Dissable Hide Lines Count",
  lastMarkedUnknownAt: "Last Marked Unknown At",
  markedUnknownCount: "Marked Unknown Count",
};

export const getColumnTitle = (id: string) => COLUMN_TITLE[id] ?? id;

export const WORD_COLUMNS: ColumnDef<UserWordWithWord>[] = [
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
    accessorKey: "word.word",
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={getColumnTitle(props.column.id)}
      />
    ),
  },
  {
    accessorKey: "word.id",
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={getColumnTitle(props.column.id)}
      />
    ),
  },
  {
    accessorKey: "createdAt",
    cell: getDateColumCell,
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={getColumnTitle(props.column.id)}
      />
    ),
  },
  {
    accessorKey: "spacedRepetitionStage",
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={getColumnTitle(props.column.id)}
      />
    ),
  },
  {
    accessorKey: "seenCount",
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={getColumnTitle(props.column.id)}
      />
    ),
  },
  {
    accessorKey: "practiceCount",
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={getColumnTitle(props.column.id)}
      />
    ),
  },
  {
    accessorKey: "nextPracticeAt",
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={getColumnTitle(props.column.id)}
      />
    ),
    cell: getDateColumCell,
  },
  {
    accessorKey: "knownAt",
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={getColumnTitle(props.column.id)}
      />
    ),
    cell: getDateColumCell,
  },
  {
    accessorKey: "lastSeenAt",
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={getColumnTitle(props.column.id)}
      />
    ),
    cell: getDateColumCell,
  },
  {
    accessorKey: "lastPracticedAt",
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={getColumnTitle(props.column.id)}
      />
    ),
    cell: getDateColumCell,
  },
  {
    accessorKey: "seenCountSinceLastPracticed",
    header: (props) => {
      return (
        <DataTableColumnHeader
          column={props.column}
          title={getColumnTitle(props.column.id)}
        />
      );
    },
  },
  {
    accessorKey: "hideLines",
    header: (props) => {
      return (
        <DataTableColumnHeader
          column={props.column}
          title={getColumnTitle(props.column.id)}
        />
      );
    },
    cell: getBooleanColumnCell,
  },
  {
    accessorKey: "lastDissabledHideLinesAt",
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={getColumnTitle(props.column.id)}
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
          title={getColumnTitle(props.column.id)}
        />
      );
    },
  },
  {
    accessorKey: "lastMarkedUnknownAt",
    header: (props) => (
      <DataTableColumnHeader
        column={props.column}
        title={getColumnTitle(props.column.id)}
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
          title={getColumnTitle(props.column.id)}
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
