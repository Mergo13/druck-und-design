"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState } from "@tanstack/react-table";
import { useState } from "react";
import { EmptyState } from "@/components/admin/empty-state";
import { DataTablePagination } from "@/components/admin/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/admin/data-table/data-table-toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  bulkActions?: React.ReactNode;
  loading?: boolean;
  error?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  getRowHref?: (row: TData) => string | undefined;
  onRowOpen?: (row: TData) => void;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  bulkActions,
  loading,
  error,
  emptyTitle = "Keine Ergebnisse",
  emptyDescription = "Passen Sie Suche oder Filter an.",
  className,
  getRowHref,
  onRowOpen
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter: searchValue },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: onSearchChange
  });

  function shouldIgnoreRowOpen(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest("a,button,input,select,textarea,label,[role='button'],[role='menuitem']"));
  }

  function openRow(rowData: TData) {
    onRowOpen?.(rowData);
    const href = getRowHref?.(rowData);
    if (href) window.location.href = href;
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-white", className)}>
      <DataTableToolbar
        table={table}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        bulkActions={bulkActions}
      />
      {error ? (
        <div className="p-4">
          <EmptyState title="Daten konnten nicht geladen werden" description={error} />
        </div>
      ) : loading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-11 w-full" />)}
        </div>
      ) : table.getRowModel().rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] caption-bottom text-sm">
            <thead className="border-b bg-slate-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="h-11 px-4 text-left align-middle">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => {
                const href = getRowHref?.(row.original);
                const clickable = Boolean(href || onRowOpen);
                return (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  aria-label={clickable ? "Zeile öffnen" : undefined}
                  onClick={(event) => {
                    if (!clickable || shouldIgnoreRowOpen(event.target)) return;
                    openRow(row.original);
                  }}
                  onKeyDown={(event) => {
                    if (!clickable || event.key !== "Enter" || shouldIgnoreRowOpen(event.target)) return;
                    event.preventDefault();
                    openRow(row.original);
                  }}
                  className={cn(
                    "border-b transition-colors hover:bg-slate-50 data-[state=selected]:bg-slate-50",
                    clickable && "cursor-pointer outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      )}
      <DataTablePagination table={table} />
    </div>
  );
}
