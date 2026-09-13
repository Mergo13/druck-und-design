"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type CsvExportMenuProps = {
  resource: string;
  selectedCount?: number;
};

export function CsvExportMenu({ resource, selectedCount = 0 }: CsvExportMenuProps) {
  const exportUrl = `/api/admin/csv/${resource}`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Download className="h-4 w-4" />
          Exportieren
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={`${exportUrl}?action=export`}>Alle exportieren</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${exportUrl}?action=export`}>Gefilterte exportieren</a>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={selectedCount === 0}>Ausgewählte exportieren ({selectedCount})</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${exportUrl}?action=template`}>CSV-Vorlage herunterladen</a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
