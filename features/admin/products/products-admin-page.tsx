"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Edit, ImageIcon, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/admin/data-table/data-table";
import { DataTableColumnHeader } from "@/components/admin/data-table/data-table-column-header";
import { PageHeader } from "@/components/admin/page-header";
import { CsvExportMenu } from "@/components/admin/csv/csv-export-menu";
import { CsvImportDialog } from "@/components/admin/csv/csv-import-dialog";
import { addAdminRecent } from "@/components/admin/admin-recents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatEuro } from "@/lib/utils";
import { getProductStartingPriceLabel } from "@/lib/print-workflow";
import type { ProductCatalogItem, ProductCategory } from "@/types/print-platform";

export function ProductsAdminPage() {
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [pricingType, setPricingType] = useState("all");
  const [visibility, setVisibility] = useState("all");
  const [savedView, setSavedView] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/catalog/products?scope=admin"),
        fetch("/api/catalog/categories?scope=admin")
      ]);
      if (!productsRes.ok || !categoriesRes.ok) throw new Error("Admin-Kataloganfrage fehlgeschlagen.");
      setProducts(await productsRes.json() as ProductCatalogItem[]);
      setCategories(await categoriesRes.json() as ProductCategory[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Produkte konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const categoryBySlug = useMemo(() => new Map(categories.map((item) => [item.slug, item.name])), [categories]);
  const filteredProducts = useMemo(() => products.filter((product) => {
    const productStatus = product.productStatus ?? (product.visible === false || product.published === false ? "inactive" : "active");
    const missingPrice = !Number(product.basePrice) && !(product.priceTiers ?? []).some((tier) => Number(tier.unitPrice ?? tier.price) > 0);
    const missingImage = !product.heroImage && !(product.gallery ?? []).length;
    const viewMatch =
      savedView === "all" ||
      (savedView === "draft" && productStatus === "draft") ||
      (savedView === "active" && productStatus === "active") ||
      (savedView === "missing-price" && missingPrice) ||
      (savedView === "missing-image" && missingImage) ||
      (savedView === "hidden" && (product.visible === false || product.published === false));
    return (
      viewMatch &&
      (category === "all" || product.category === category) &&
      (status === "all" || productStatus === status) &&
      (pricingType === "all" || product.pricingType === pricingType) &&
      (visibility === "all" || (visibility === "visible" ? product.visible !== false : product.visible === false))
    );
  }), [category, pricingType, products, savedView, status, visibility]);

  async function updateProduct(slug: string, patch: Partial<ProductCatalogItem>) {
    const current = products.find((item) => item.slug === slug);
    if (!current) return;
    const response = await fetch("/api/catalog/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...current, ...patch })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { message?: string } | null;
      alert(payload?.message ?? "Produkt konnte nicht aktualisiert werden.");
      return;
    }
    const saved = await response.json() as ProductCatalogItem;
    setProducts((items) => items.map((item) => item.slug === slug ? saved : item));
  }

  async function deleteProduct(slug: string) {
    if (!window.confirm(`Produkt ${slug} löschen?`)) return;
    const response = await fetch(`/api/catalog/products/${encodeURIComponent(slug)}`, { method: "DELETE" });
    if (!response.ok) {
      alert("Produkt konnte nicht gelöscht werden.");
      return;
    }
    await load();
  }

  const columns = useMemo<ColumnDef<ProductCatalogItem>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(value)}
          aria-label="Alle auswählen"
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(value: boolean) => row.toggleSelected(value)} aria-label="Zeile auswählen" />
      ),
      enableSorting: false,
      enableHiding: false
    },
    {
      id: "image",
      header: "",
      cell: ({ row }) => {
        const src = row.original.heroImage || row.original.gallery?.[0];
        return (
          <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-md border bg-slate-50">
            {src ? <Image src={src} alt="" width={40} height={40} className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-slate-400" />}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Produkt" />,
      cell: ({ row }) => (
        <div className="min-w-0">
          <Link href={`/admin/catalog/products/${encodeURIComponent(row.original.slug)}`} className="font-black text-slate-950 hover:underline">
            {row.original.name}
          </Link>
          <p className="text-xs font-semibold text-slate-500">{row.original.slug}</p>
        </div>
      )
    },
    {
      accessorKey: "category",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kategorie" />,
      cell: ({ row }) => categoryBySlug.get(row.original.category) ?? row.original.category
    },
    {
      accessorKey: "basePrice",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Preis" />,
      cell: ({ row }) => <span className="font-semibold tabular-nums">{getProductStartingPriceLabel(row.original) || formatEuro(Number(row.original.basePrice ?? 0))}</span>
    },
    {
      id: "pricing",
      accessorFn: (row) => typeof row.pricingProfile === "object" ? row.pricingProfile.key : row.pricingProfile,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Preise" />,
      cell: ({ row }) => <span className="text-xs font-semibold text-slate-600">{typeof row.original.pricingProfile === "object" ? row.original.pricingProfile.key : row.original.pricingProfile ?? row.original.pricingType ?? "-"}</span>
    },
    {
      id: "status",
      accessorFn: (row) => row.productStatus ?? (row.visible === false || row.published === false ? "inactive" : "active"),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const productStatus = row.original.productStatus ?? (row.original.visible === false || row.original.published === false ? "inactive" : "active");
        const label = productStatus === "active" ? "Aktiv" : productStatus === "draft" ? "Entwurf" : "Inaktiv";
        return (
          <Select value={productStatus} onValueChange={(value) => void updateProduct(row.original.slug, { productStatus: value as ProductCatalogItem["productStatus"] })}>
            <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="draft">Entwurf</SelectItem>
              <SelectItem value="inactive">Inaktiv</SelectItem>
            </SelectContent>
          </Select>
        );
      }
    },
    {
      id: "visible",
      header: "Sichtbar",
      cell: ({ row }) => (
        <Checkbox checked={row.original.visible !== false} onCheckedChange={(checked) => void updateProduct(row.original.slug, { visible: Boolean(checked), productStatus: Boolean(checked) && row.original.published !== false ? "active" : "inactive" })} aria-label="Sichtbarkeit ändern" />
      )
    },
    {
      id: "published",
      header: "Publiziert",
      cell: ({ row }) => (
        <Checkbox checked={row.original.published !== false} onCheckedChange={(checked) => void updateProduct(row.original.slug, { published: Boolean(checked), productStatus: Boolean(checked) && row.original.visible !== false ? "active" : "inactive" })} aria-label="Publikation ändern" />
      )
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="Zeilenaktionen">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/catalog/products/${encodeURIComponent(row.original.slug)}`}>
                <Edit className="mr-2 h-4 w-4" />
                Bearbeiten
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => void deleteProduct(row.original.slug)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableHiding: false
    }
  ], [categoryBySlug]);

  return (
    <>
      <PageHeader
        title="Produkte"
        description="Produkte, Preise, Konfiguration, Sichtbarkeit und CSV-Katalogtransfer verwalten."
        actions={
          <>
            <CsvImportDialog resource="products" onImported={load} />
            <CsvExportMenu resource="products" />
            <Button asChild size="sm">
              <Link href="/admin/catalog/products/new">
                <Plus className="h-4 w-4" />
                Neues Produkt
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        {[
          ["all", "Alle"],
          ["draft", "Entwürfe"],
          ["active", "Aktiv"],
          ["missing-price", "Fehlender Preis"],
          ["missing-image", "Fehlendes Bild"],
          ["hidden", "Versteckt"]
        ].map(([value, label]) => (
          <Button key={value} type="button" size="sm" variant={savedView === value ? "default" : "outline"} onClick={() => setSavedView(value)}>
            {label}
          </Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filteredProducts}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Produkte suchen..."
        loading={loading}
        error={error}
        emptyTitle="Keine Produkte gefunden"
        getRowHref={(product) => `/admin/catalog/products/${encodeURIComponent(product.slug)}`}
        onRowOpen={(product) => addAdminRecent({
          id: product.slug,
          type: "Produkt",
          label: product.name,
          href: `/admin/catalog/products/${encodeURIComponent(product.slug)}`,
          subtitle: product.slug
        })}
        filters={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {categories.map((item) => <SelectItem key={item.slug} value={item.slug}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="draft">Entwurf</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
              </SelectContent>
            </Select>
            <Select value={pricingType} onValueChange={setPricingType}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Preisart" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Preisarten</SelectItem>
                <SelectItem value="fixed">Fixpreis</SelectItem>
                <SelectItem value="tiered">Staffelpreis</SelectItem>
                <SelectItem value="area">Fläche</SelectItem>
                <SelectItem value="hourly">Stundensatz</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Sichtbarkeit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Sichtbarkeiten</SelectItem>
                <SelectItem value="visible">Sichtbar</SelectItem>
                <SelectItem value="hidden">Versteckt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </>
  );
}
