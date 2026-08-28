import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminDashboardHome } from "@/features/admin/dashboard/admin-dashboard-home";
import { requireAdminPage } from "@/lib/admin-page-auth";

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin-Dashboard für Produkte, Neuigkeiten, Gruppen, Bestellungen, Rechnungen und Shop-Steuerung."
};

export default async function AdminPage() {
  const { user } = await requireAdminPage();
  return (
    <AdminShell title="Dashboard" email={user.email}>
      <AdminDashboardHome />
    </AdminShell>
  );
}
