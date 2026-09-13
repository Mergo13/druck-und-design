import { AdminShell } from "@/components/admin/admin-shell";
import { CatalogResourcePage } from "@/features/admin/catalog/catalog-resource-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminCategoriesPage() {
  const { user } = await requireAdminPage();
  return (
    <AdminShell title="Kategorien" email={user.email}>
      <CatalogResourcePage resource="categories" title="Kategorien" description="Katalog-Kategorien verwalten, ohne weitere Hauptpunkte in der Seitenleiste zu erzeugen." endpoint="/api/catalog/categories?scope=admin" />
    </AdminShell>
  );
}
