"use client";

import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  InitialTableState,
  Row,
  RowSelectionState,
  SortingState,
  Table as TanstackTable,
  VisibilityState,
} from "@tanstack/react-table";
import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Loader2 } from "lucide-react";

import { usePersistState } from "~/hooks/useLocalStorageState";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableViewOptions } from "./DataTableViewOptions";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

function getCommonPinningStyles<
  TData = Record<string, unknown>,
  TValue = unknown,
>(column: Column<TData, TValue>): CSSProperties {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn =
    isPinned === "left" && column.getIsLastColumn("left");
  const isFirstRightPinnedColumn =
    isPinned === "right" && column.getIsFirstColumn("right");

  return {
    boxShadow: isLastLeftPinnedColumn
      ? "-1px 0 0 hsl(var(--border)) inset"
      : isFirstRightPinnedColumn
        ? "1px 0 0 hsl(var(--border)) inset"
        : undefined,
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    position: isPinned ? "sticky" : "relative",
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  };
}

interface DataTableProps<TData = Record<string, unknown>, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterColumn?: string;
  filterPlaceholder?: string;
  isLoading?: boolean;
  renderActions?: ({ table }: { table: TanstackTable<TData> }) => ReactNode;
  renderLoading?: ({ table }: { table: TanstackTable<TData> }) => ReactNode;
  renderRowSelectionActios?: ({
    table,
  }: {
    table: TanstackTable<TData>;
  }) => ReactNode;
  persistKeyPrefix: string;
  initialState?: InitialTableState;
  getRowId?: (
    originalRow: TData,
    index: number,
    parent?: Row<TData> | undefined,
  ) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumn,
  renderActions,
  isLoading,
  renderLoading,
  persistKeyPrefix,
  initialState,
  renderRowSelectionActios,
  getRowId,
  filterPlaceholder,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = usePersistState<SortingState>(
    `${persistKeyPrefix}-sorting`,
    [],
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    usePersistState<VisibilityState>(
      `${persistKeyPrefix}-column-visibility`,
      {},
    );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable<TData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getRowId,
    initialState,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div>
      <div className="flex items-center py-4">
        {Object.values(rowSelection).filter(Boolean).length > 0 ? (
          (renderRowSelectionActios?.({ table }) ?? null)
        ) : filterColumn ? (
          <Input
            placeholder={filterPlaceholder ?? "Filter rows"}
            value={
              (table.getColumn(filterColumn)?.getFilterValue() as
                | string
                | undefined) ?? ""
            }
            onChange={(event) =>
              table.getColumn(filterColumn)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        ) : null}
        <div className="flex flex-1 items-center justify-end gap-2">
          {renderActions?.({ table })}
          <DataTableViewOptions table={table} />
        </div>
      </div>
      {isLoading ? (
        renderLoading ? (
          renderLoading({ table })
        ) : (
          <div className="flex h-32 items-center justify-center rounded-md border">
            <Loader2 className="animate-spin" />
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        style={{
                          ...getCommonPinningStyles(header.column),
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="whitespace-nowrap"
                        style={{ ...getCommonPinningStyles(cell.column) }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <DataTablePagination table={table} />
    </div>
  );
}
