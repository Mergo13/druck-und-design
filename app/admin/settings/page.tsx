import { AdminShell } from "@/components/admin/admin-shell";
import { SettingsConsolidatedPage } from "@/features/admin/settings/store-control-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminSettingsPage() {
  const { user } = await requireAdminPage();
  return <AdminShell title="Einstellungen" email={user.email}><SettingsConsolidatedPage /></AdminShell>;
}
