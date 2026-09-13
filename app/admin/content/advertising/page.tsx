import { AdminShell } from "@/components/admin/admin-shell";
import { AdvertisingToolPage } from "@/features/admin/tools/admin-tool-pages";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminAdvertisingPage() {
  const { user } = await requireAdminPage();
  return <AdminShell title="Werbung" email={user.email}><AdvertisingToolPage /></AdminShell>;
}
