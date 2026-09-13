import { AdminShell } from "@/components/admin/admin-shell";
import { LayoutStudioPage } from "@/features/admin/tools/admin-tool-pages";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminLayoutsPage() {
  const { user } = await requireAdminPage();
  return <AdminShell title="Layout Studio" email={user.email}><LayoutStudioPage /></AdminShell>;
}
