import { AdminShell } from "@/components/admin/admin-shell";
import { ReportsPage } from "@/features/admin/reports/reports-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminSalesReportPage() {
  const { user } = await requireAdminPage();
  return <AdminShell title="Verkaufsbericht" email={user.email}><ReportsPage mode="sales" /></AdminShell>;
}
