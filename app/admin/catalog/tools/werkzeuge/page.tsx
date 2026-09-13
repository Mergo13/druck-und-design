import { AdminShell } from "@/components/admin/admin-shell";
import { CatalogToolsPage } from "@/features/admin/tools/admin-tool-pages";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminCatalogWerkzeugePage() {
  const { user } = await requireAdminPage();
  return (
    <AdminShell title="Katalog-Werkzeuge" email={user.email}>
      <CatalogToolsPage />
    </AdminShell>
  );
}

