import { AdminShell } from "@/components/admin/admin-shell";
import { AdminModulePage } from "@/features/admin/modules/admin-module-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminOrdersPage() {
  const { user } = await requireAdminPage();
  return <AdminShell title="Bestellungen" email={user.email}><AdminModulePage moduleKey="orders" title="Bestellungen" description="Webshop-Bestellungen und Fulfillment-Status." detailBasePath="/admin/sales/orders" /></AdminShell>;
}
