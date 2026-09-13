import { AdminShell } from "@/components/admin/admin-shell";
import { AdminModulePage } from "@/features/admin/modules/admin-module-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminCouponsPage() {
  const { user } = await requireAdminPage();
  return <AdminShell title="Gutscheine" email={user.email}><AdminModulePage moduleKey="coupons" title="Gutscheine" description="Rabattcodes und Gutschein-Konfiguration." /></AdminShell>;
}
