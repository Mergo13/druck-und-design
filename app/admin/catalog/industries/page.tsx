import { AdminShell } from "@/components/admin/admin-shell";
import { CatalogResourcePage } from "@/features/admin/catalog/catalog-resource-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminIndustriesPage() {
  const { user } = await requireAdminPage();
  return (
    <AdminShell title="Branchen" email={user.email}>
      <CatalogResourcePage resource="industries" title="Branchen" description="Branchen-Landingpages aus der bestehenden Katalog-API." endpoint="/api/catalog/industries?scope=admin" />
    </AdminShell>
  );
}
