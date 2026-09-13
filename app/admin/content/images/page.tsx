import { AdminShell } from "@/components/admin/admin-shell";
import { SiteImagesToolPage } from "@/features/admin/tools/admin-tool-pages";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminSiteImagesPage() {
  const { user } = await requireAdminPage();
  return <AdminShell title="Website-Bilder" email={user.email}><SiteImagesToolPage /></AdminShell>;
}
