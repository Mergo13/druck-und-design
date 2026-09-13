import { AdminShell } from "@/components/admin/admin-shell";
import { CatalogResourcePage } from "@/features/admin/catalog/catalog-resource-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminPropertiesPage() {
  const { user } = await requireAdminPage();
  return (
    <AdminShell title="Eigenschaften / Attribute" email={user.email}>
      <CatalogResourcePage resource="properties" title="Eigenschaften" description="Globale Produktattribute, Werte, Reihenfolge und Preis-Metadaten." endpoint="/api/catalog/properties" />
    </AdminShell>
  );
}
