import type { CellContext, ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import type { RouterInputs, RouterOutputs } from "~/trpc/react";
import {
  useMarkWordKnownMutation,
  useMarkWordUnknownMutation,
} from "~/hooks/mutations";
import { usePersistState } from "~/hooks/useLocalStorageState";
import { usePracticeLanguageCode } from "~/hooks/usePracticeLanguageCode";
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

type Word = RouterOutputs["words"]["getAllWords"][number];

const getDateColumCell = (props: CellContext<Word, unknown>) => {
  const value = props.getValue() as Date | null;
  if (value) {
    return formatDate(value);
  }
  return "-";
};
const getBooleanColumnCell = (props: CellContext<Word, unknown>) => {
  const value = props.getValue() as boolean | null;
  if (value !== null) {
    return value ? "True" : "False";
  }
  return "-";
};

const WordActionButton = ({ word }: { word: Word }) => {
  const utils = api.useUtils();
  const practiceLanguageCode = usePracticeLanguageCode();
  const markKnownMut = useMarkWordKnownMutation();
  const markUnknownMut = useMarkWordUnknownMutation();

  const deleteWordMut = api.words.deleteWord.useMutation({
    onSuccess: () => {
      void utils.words.getAllWords.invalidate({
        languageCode: word.languageCode,
      });
      void utils.languages.getPracticeLanguage.invalidate(practiceLanguageCode);
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

export default function PracticeWordsManager() {
  const practiceLanguage = usePracticeLanguageCode();
  const [filter, setFilter] = usePersistState<
    RouterInputs["words"]["getAllWords"]["filter"]
  >("all-words-filter", "all");

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
          persistKeyPrefix="words-data-table"
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
          initialState={{
            columnPinning: {
              left: ["select", "word"],
              right: ["actions"],
            },
          }}
        />
      )}
    </section>
  );
}
