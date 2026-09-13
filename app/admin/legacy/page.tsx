import { AdminClient } from "@/app/admin/admin-client";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function LegacyAdminPage() {
  await requireAdminPage();
  return <AdminClient />;
}
