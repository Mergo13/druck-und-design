import { AdminShell } from "@/components/admin/admin-shell";
import { StoreControlPage } from "@/features/admin/settings/store-control-page";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminStoreControlPage() {
  const { user } = await requireAdminPage();
  return <AdminShell title="Shop-Steuerung" email={user.email}><StoreControlPage /></AdminShell>;
}
