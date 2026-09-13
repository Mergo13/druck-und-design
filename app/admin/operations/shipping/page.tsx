import { AdminShell } from "@/components/admin/admin-shell";
import { AdminModulePage } from "@/features/admin/modules/admin-module-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminShippingPage() {
  const { user } = await requireAdminPage();
  return <AdminShell title="Versand" email={user.email}><AdminModulePage moduleKey="shipping" title="Versand" description="Versandarten und Lieferzeitangaben." /></AdminShell>;
}
