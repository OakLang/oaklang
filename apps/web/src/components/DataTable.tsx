"use client";

import type {
  CellContext,
  Column,
  ColumnDef,
  ColumnPinningState,
  OnChangeFn,
  PaginationOptions,
  PaginationState,
  Row,
  SortingState,
  Table as TanstackTable,
  VisibilityState,
} from "@tanstack/react-table";
import type { CSSProperties, ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { CheckIcon, XIcon } from "lucide-react";

import { formatDate } from "~/utils";
import { DataTablePagination } from "./DataTablePagination";
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

export function getDateColumCell<
  TData = Record<string, unknown>,
  TValue = unknown,
>(props: CellContext<TData, TValue>) {
  const value = props.getValue() as Date | null;
  if (value) {
    return formatDate(value);
  }
  return "-";
}

export function getBooleanColumnCell<
  TData = Record<string, unknown>,
  TValue = unknown,
>(props: CellContext<TData, TValue>) {
  const value = props.getValue() as boolean | null;
  if (value !== null) {
    return value ? (
      <CheckIcon className="h-4 w-4" />
    ) : (
      <XIcon className="h-4 w-4" />
    );
  }
  return "-";
}

export const DEFAULT_PAGE_INDEX = 0;
export const DEFAULT_PAGE_SIZE = 10;

export type PaginationParams = PaginationState;
export interface SortParams {
  sortBy: `${string}.${"asc" | "desc"}`;
}
export type Filters<T> = Partial<T & PaginationParams & SortParams>;

interface DataTableProps<TData = Record<string, unknown>, TValue = unknown> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  pagination?: PaginationState;
  paginationOptions?: Pick<
    PaginationOptions,
    "onPaginationChange" | "rowCount"
  >;
  filters?: Filters<TData>;
  onFilterChange?: (dataFilters: Partial<TData>) => void;
  onSortingChange?: OnChangeFn<SortingState>;
  sorting?: SortingState;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  columnPinning?: ColumnPinningState;
  onColumnPinningChange?: OnChangeFn<ColumnPinningState>;
  header?: (table: TanstackTable<TData>) => ReactNode;
  footer?: (table: TanstackTable<TData>) => ReactNode;
  getRowId?:
    | ((
        originalRow: TData,
        index: number,
        parent?: Row<TData> | undefined,
      ) => string)
    | undefined;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onSortingChange,
  pagination,
  paginationOptions,
  sorting,
  columnVisibility,
  onColumnVisibilityChange,
  header,
  footer,
  columnPinning,
  onColumnPinningChange,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable<TData>({
    data,
    columns,
    state: { pagination, sorting, columnVisibility, columnPinning },
    onSortingChange,
    ...paginationOptions,
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange,
    onColumnPinningChange,
    getRowId,
  });

  return (
    <div>
      {header?.(table)}
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
      <DataTablePagination table={table} />
      {footer?.(table)}
    </div>
  );
}
