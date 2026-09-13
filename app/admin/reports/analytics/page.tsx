import { AdminShell } from "@/components/admin/admin-shell";
import { ReportsPage } from "@/features/admin/reports/reports-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminAnalyticsPage() {
  const { user } = await requireAdminPage();
  return <AdminShell title="Analysen" email={user.email}><ReportsPage mode="analytics" /></AdminShell>;
}
