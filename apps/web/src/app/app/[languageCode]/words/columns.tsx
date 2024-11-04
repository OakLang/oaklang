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
      <DataTableColumnHeader column={props.column} title="Word" />
    ),
  },
  {
    accessorKey: "word.id",
    header: (props) => (
      <DataTableColumnHeader column={props.column} title="Word Id" />
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
