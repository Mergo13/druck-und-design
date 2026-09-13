"use client";

import type { ReactNode } from "react";
import type { Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "@/components/admin/data-table/data-table-view-options";

type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  bulkActions?: ReactNode;
};

export function DataTableToolbar<TData>({
  table,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Suchen...",
  filters,
  bulkActions
}: DataTableToolbarProps<TData>) {
  const hasSelection = table.getFilteredSelectedRowModel().rows.length > 0;

  return (
    <div className="flex flex-col gap-3 border-b bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder} className="pl-9" />
        </div>
        {searchValue ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onSearchChange("")}>
            <X className="h-4 w-4" />
            Zurücksetzen
          </Button>
        ) : null}
        {filters}
      </div>
      <div className="flex items-center gap-2">
        {hasSelection ? bulkActions : null}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
