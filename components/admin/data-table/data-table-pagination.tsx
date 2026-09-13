"use client";

import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
};

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  const selected = table.getFilteredSelectedRowModel().rows.length;
  const total = table.getFilteredRowModel().rows.length;

  return (
    <div className="flex flex-col gap-3 border-t bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm font-medium text-slate-500">
        {selected ? `${selected} ausgewählt. ` : null}
        {total ? `${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-${Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, total)} von ${total}` : "0 von 0"}
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Zurück
        </Button>
        <div className="text-sm font-semibold text-slate-600">
          Seite {table.getState().pagination.pageIndex + 1} von {table.getPageCount() || 1}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Weiter
        </Button>
      </div>
    </div>
  );
}
