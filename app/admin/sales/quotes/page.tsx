import { AdminShell } from "@/components/admin/admin-shell";
import { AdminModulePage } from "@/features/admin/modules/admin-module-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminQuotesPage() {
  const { user } = await requireAdminPage();
  return <AdminShell title="Angebote" email={user.email}><AdminModulePage moduleKey="quotes" title="Angebote" description="Kundenanfragen und Angebote." detailBasePath="/admin/sales/quotes" /></AdminShell>;
}
