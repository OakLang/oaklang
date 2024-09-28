"use client";

import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  Table as TanstackTable,
  VisibilityState,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
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
import pluralize from "pluralize";

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

interface DataTableProps<TData = Record<string, unknown>, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterColumn: string;
  isLoading?: boolean;
  renderActions?: ({ table }: { table: TanstackTable<TData> }) => ReactNode;
  renderLoading?: ({ table }: { table: TanstackTable<TData> }) => ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumn,
  renderActions,
  isLoading,
  renderLoading,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
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
        <Input
          placeholder={`Filter ${pluralize(filterColumn)}...`}
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
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
                      <TableCell key={cell.id} className="whitespace-nowrap">
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
