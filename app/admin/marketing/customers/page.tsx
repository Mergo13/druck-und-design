import { AdminShell } from "@/components/admin/admin-shell";
import { AdminModulePage } from "@/features/admin/modules/admin-module-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminCustomersPage() {
  const { user } = await requireAdminPage();
  return (
    <AdminShell title="Kunden" email={user.email}>
      <AdminModulePage moduleKey="customers" title="Kunden" description="Kundenkonten, Kontaktdaten und Profilfelder aus der bestehenden Kunden-Datenbank." />
    </AdminShell>
  );
}
