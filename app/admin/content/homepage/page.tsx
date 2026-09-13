import { AdminShell } from "@/components/admin/admin-shell";
import { HomepageToolPage } from "@/features/admin/tools/admin-tool-pages";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminHomepageContentPage() {
  const { user } = await requireAdminPage();
  return <AdminShell title="Homepage" email={user.email}><HomepageToolPage /></AdminShell>;
}
