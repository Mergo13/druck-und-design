import { AdminShell } from "@/components/admin/admin-shell";
import { AdminModulePage } from "@/features/admin/modules/admin-module-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminInvoicesPage() {
  const { user } = await requireAdminPage();
  return <AdminShell title="Rechnungen" email={user.email}><AdminModulePage moduleKey="invoices" title="Rechnungen" description="Lokal oder über Integrationen erzeugte Rechnungen." detailBasePath="/admin/sales/invoices" /></AdminShell>;
}
