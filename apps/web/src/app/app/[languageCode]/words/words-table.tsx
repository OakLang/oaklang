"use client";

import type { ColumnSort, PaginationState } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { keepPreviousData } from "@tanstack/react-query";
import { DownloadIcon, MoreVerticalIcon, TableIcon } from "lucide-react";
import pluralize from "pluralize";

import type { RouterInputs } from "~/trpc/react";
import type { LanguageCodeParams } from "~/types";
import {
  DataTable,
  DEFAULT_PAGE_INDEX,
  DEFAULT_PAGE_SIZE,
} from "~/components/DataTable";
import { DataTableViewOptions } from "~/components/DataTableViewOptions";
import { useExportWordsDialog } from "~/components/dialogs/export-words-dialog";
import { useImportWordsFromCsvDialog } from "~/components/dialogs/import-words-from-csv-dialog";
import RenderQueryResult from "~/components/RenderQueryResult";
import SearchBar from "~/components/SearchBar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useAppStore } from "~/store/app-store";
import { api } from "~/trpc/react";
import AddWordsButton from "./add-words-button";
import { getColumnTitle, WORD_COLUMNS } from "./columns";

export default function WardsTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const columnVisibility = useAppStore(
    (state) => state.wordsTableColumnVisibility,
  );
  const setColumnVisibility = useAppStore(
    (state) => state.setWordsTableColumnVisibility,
  );

  const filters = useMemo(() => {
    const pageIndex = searchParams.get("pageIndex");
    const pageSize = searchParams.get("pageSize");
    const sortBy = searchParams.get("sortBy");
    const search = searchParams.get("search");
    let filter = searchParams.get("filter") ?? "all";

    if (!["unknown", "all", "known", "practicing"].includes(filter)) {
      filter = "all";
    }

    return {
      pageIndex: pageIndex ? parseInt(pageIndex) : DEFAULT_PAGE_INDEX,
      pageSize: pageSize ? parseInt(pageSize) : DEFAULT_PAGE_SIZE,
      sortBy,
      search,
      filter: filter as RouterInputs["words"]["getUserWords"]["filter"],
    };
  }, [searchParams]);

  const pagination = useMemo((): PaginationState => {
    return {
      pageIndex: filters.pageIndex,
      pageSize: filters.pageSize,
    };
  }, [filters.pageIndex, filters.pageSize]);

  const sorting = useMemo((): ColumnSort => {
    if (filters.sortBy) {
      const [id, order] = filters.sortBy.split(".");
      return id && order
        ? { id, desc: order === "desc" }
        : { id: "createdAt", desc: false };
    }
    return { id: "createdAt", desc: false };
  }, [filters.sortBy]);

  const { languageCode } = useParams<LanguageCodeParams>();
  const [ExportWordsDialog, _exportWordsDialogOpen, setExportWordsDialogOpen] =
    useExportWordsDialog();
  const [
    ImportWordsFromCsvDialog,
    _importWordsFromCsvDialogOpen,
    setImportWordsFromCsvDialogOpen,
  ] = useImportWordsFromCsvDialog();

  const wordsQuery = api.words.getUserWords.useQuery(
    {
      languageCode,
      filter: filters.filter,
      search: filters.search ?? "",
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sortBy: sorting.id,
      sortDesc: sorting.desc,
    },
    {
      placeholderData: keepPreviousData,
    },
  );

  const columns = useMemo(() => WORD_COLUMNS, []);

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
      void wordsQuery.refetch();
      void utils.languages.getPracticeLanguage.invalidate({
        languageCode: languageCode,
      });
      void utils.languages.getPracticeLanguages.invalidate();
    },
    [
      wordsQuery,
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
      void wordsQuery.refetch();
      void utils.languages.getPracticeLanguage.invalidate({
        languageCode: languageCode,
      });
      void utils.languages.getPracticeLanguages.invalidate();
    },
    [
      wordsQuery,
      deleteUserWordMut,
      languageCode,
      utils.languages.getPracticeLanguage,
      utils.languages.getPracticeLanguages,
    ],
  );

  const handleFilterChange = useCallback(
    (filter: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("filter", filter);
      params.delete("pageIndex");
      router.push(pathname + "?" + params.toString());
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Words</h2>
      </div>

      <RenderQueryResult query={wordsQuery}>
        {(query) => (
          <DataTable
            columns={columns}
            data={query.data.list}
            getRowId={(row) => row.wordId}
            pagination={pagination}
            paginationOptions={{
              onPaginationChange: (updaterOrValue) => {
                const newPaginationState =
                  typeof updaterOrValue === "function"
                    ? updaterOrValue(pagination)
                    : updaterOrValue;
                const params = new URLSearchParams(searchParams.toString());
                if (newPaginationState.pageIndex !== DEFAULT_PAGE_INDEX) {
                  params.set("pageIndex", String(newPaginationState.pageIndex));
                } else {
                  params.delete("pageIndex");
                }
                if (newPaginationState.pageSize !== DEFAULT_PAGE_SIZE) {
                  params.set("pageSize", String(newPaginationState.pageSize));
                } else {
                  params.delete("pageSize");
                }
                router.push(pathname + "?" + params.toString());
              },
              rowCount: query.data.rowCount,
            }}
            sorting={[sorting]}
            onSortingChange={(updaterOrValue) => {
              const [newValue] =
                typeof updaterOrValue === "function"
                  ? updaterOrValue([sorting])
                  : updaterOrValue;

              const params = new URLSearchParams(searchParams.toString());
              if (newValue) {
                params.set(
                  "sortBy",
                  `${newValue.id}.${newValue.desc ? "desc" : "asc"}`,
                );
              } else {
                params.delete("sortBy");
              }
              router.push(pathname + "?" + params.toString());
            }}
            columnPinning={{
              left: ["select", "word_word"],
              right: ["actions"],
            }}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={(updaterOrValue) => {
              const newValue =
                typeof updaterOrValue === "function"
                  ? updaterOrValue(columnVisibility)
                  : updaterOrValue;
              setColumnVisibility(newValue);
            }}
            header={(table) => {
              const selectedWordIds = table
                .getSelectedRowModel()
                .rows.map((row) => row.original.wordId);
              if (selectedWordIds.length > 0) {
                return (
                  <div className="mb-4 flex flex-wrap gap-2">
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
              }
              return (
                <div className="mb-4 flex gap-2 max-lg:flex-col lg:items-center">
                  <div className="flex items-center gap-2">
                    <Tabs value={filters.filter}>
                      <TabsList>
                        <TabsTrigger
                          onClick={() => {
                            handleFilterChange("all");
                          }}
                          value="all"
                        >
                          All
                        </TabsTrigger>
                        <TabsTrigger
                          onClick={() => {
                            handleFilterChange("known");
                          }}
                          value="known"
                        >
                          Known
                        </TabsTrigger>
                        <TabsTrigger
                          onClick={() => {
                            handleFilterChange("unknown");
                          }}
                          value="unknown"
                        >
                          Unknown
                        </TabsTrigger>
                        <TabsTrigger
                          onClick={() => {
                            handleFilterChange("practicing");
                          }}
                          value="practicing"
                        >
                          Practicing
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <DataTableViewOptions
                      table={table}
                      getColumnTitle={getColumnTitle}
                    />
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-2">
                    <SearchBar
                      className="w-full flex-1 lg:max-w-80"
                      deleteParamsOnSearch={["pageIndex"]}
                      placeholder="Search word, id..."
                    />
                    <AddWordsButton />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="outline">
                          <MoreVerticalIcon className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="bottom" align="end">
                        <DropdownMenuGroup title="Import words">
                          <DropdownMenuItem
                            onClick={() =>
                              setImportWordsFromCsvDialogOpen(true)
                            }
                          >
                            <TableIcon className="mr-2 h-4 w-4" />
                            Import from CSV
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup title="Export words">
                          <DropdownMenuItem
                            onClick={() => setExportWordsDialogOpen(true)}
                          >
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Export as CSV
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            }}
          />
        )}
      </RenderQueryResult>

      <ExportWordsDialog />
      <ImportWordsFromCsvDialog />
    </div>
  );
}
