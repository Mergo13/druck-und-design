"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/admin/data-table/data-table";
import { DataTableColumnHeader } from "@/components/admin/data-table/data-table-column-header";
import { PageHeader } from "@/components/admin/page-header";
import { CsvExportMenu } from "@/components/admin/csv/csv-export-menu";
import { CsvImportDialog } from "@/components/admin/csv/csv-import-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { addAdminRecent } from "@/components/admin/admin-recents";

type CatalogRow = {
  slug: string;
  name: string;
  visible?: boolean;
  published?: boolean;
  active?: boolean;
  sortOrder?: number;
  featured?: boolean;
  usageCount?: number;
};

type CatalogResourcePageProps = {
  resource: "categories" | "properties" | "industries";
  title: string;
  description: string;
  endpoint: string;
};

export function CatalogResourcePage({ resource, title, description, endpoint }: CatalogResourcePageProps) {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const basePath = `/admin/catalog/${resource}`;

  async function load() {
    setLoading(true);
    setError("");
    const response = await fetch(endpoint);
    if (!response.ok) {
      setError("Katalogdaten konnten nicht geladen werden.");
    } else {
      setRows(await response.json() as CatalogRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [endpoint]);

  async function deleteRow(slug: string) {
    if (!window.confirm(`${slug} löschen?`)) return;
    const apiResource = resource === "properties" ? "properties" : resource;
    const response = await fetch(`/api/catalog/${apiResource}/${encodeURIComponent(slug)}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { message?: string } | null;
      alert(payload?.message ?? "Datensatz konnte nicht gelöscht werden.");
      return;
    }
    await load();
  }

  const columns = useMemo<ColumnDef<CatalogRow>[]>(() => [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <div><p className="font-black">{row.original.name}</p><p className="text-xs text-slate-500">{row.original.slug}</p></div>
    },
    {
      accessorKey: "sortOrder",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Reihenfolge" />,
      cell: ({ row }) => row.original.sortOrder ?? "-"
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const active = row.original.active ?? (row.original.visible !== false && row.original.published !== false);
        return <Badge variant={active ? "success" : "secondary"}>{active ? "aktiv" : "inaktiv"}</Badge>;
      }
    },
    {
      id: "meta",
      header: "Details",
      cell: ({ row }) => resource === "properties" ? `${row.original.usageCount ?? 0} Produkte` : row.original.featured ? "hervorgehoben" : "-"
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="Zeilenaktionen">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`${basePath}/${encodeURIComponent(row.original.slug)}`}>
                <Edit className="mr-2 h-4 w-4" />
                Bearbeiten
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => void deleteRow(row.original.slug)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ], [basePath, resource]);

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <CsvImportDialog resource={resource} onImported={load} />
            <CsvExportMenu resource={resource} />
            <Button asChild size="sm">
              <Link href={`${basePath}/new`}>
                <Plus className="h-4 w-4" />
                Neu
              </Link>
            </Button>
          </>
        }
      />
      <DataTable
        columns={columns}
        data={rows}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder={`${title} suchen...`}
        loading={loading}
        error={error}
        getRowHref={(row) => `${basePath}/${encodeURIComponent(row.slug)}`}
        onRowOpen={(row) => addAdminRecent({
          id: row.slug,
          type: title,
          label: row.name,
          href: `${basePath}/${encodeURIComponent(row.slug)}`,
          subtitle: row.slug
        })}
      />
    </>
  );
}
